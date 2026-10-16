import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CatalogsService } from '../catalogs/catalogs.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { ProjectsService } from '../projects/projects.service.js';
import { SpecimenTestsService } from '../specimen-tests/specimen-tests.service.js';
import {
  CalendarDate,
  calendarDateToDb,
  InvalidCalendarDateError,
  parseCalendarDate,
} from '../shared/dates/calendar-date.js';
import { parseTimeOfDay, timeOfDayToDb } from '../shared/dates/time-of-day.js';
import type { PaginatedResult } from '../shared/http/api-response.js';
import { paginated, searchTerm, skipTake } from '../shared/http/pagination.js';
import { isUniqueViolation } from '../shared/prisma/prisma-errors.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';
import {
  assertFieldRecordTransition,
  type FieldRecordStatus,
  InvalidTransitionError,
} from './domain/lifecycle.js';
import { duplicateNumbers, formatRegistryNumber, nextNumber } from './domain/numbering.js';
import type {
  CreateFieldRecordDto,
  DeliveryFormDto,
  FieldRecordFormDto,
  ListFieldRecordsQueryDto,
} from './dto/field-record.dto.js';
import {
  type FieldRecordDetail,
  type FieldRecordSummary,
  toDetail,
  toSummary,
} from './field-records.views.js';

export interface NextNumbers {
  registrySequence: number;
  sampleNumber: number;
  specimenNumber: number;
}

const DETAIL_INCLUDE = {
  supplier: { select: { id: true, name: true } },
  cementType: { select: { id: true, name: true } },
  deliveries: {
    orderBy: { sequence: 'asc' },
    include: {
      ticketCementType: { select: { id: true, name: true } },
      // Paper order = ascending numbers (Q-14); unnumbered draft rows go last.
      samples: {
        orderBy: [{ sampleNumber: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
        include: {
          specimens: {
            orderBy: [{ specimenNumber: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
          },
        },
      },
    },
  },
} satisfies Prisma.FieldRecordInclude;

const UNIQUE_RETRIES = 3;

/**
 * Owns `field_records`, `deliveries`, `samples` and `specimens` (they are captured
 * together on FPC01-01). Every method takes `tenantId` first.
 */
@Injectable()
export class FieldRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly catalogs: CatalogsService,
    private readonly specimenTests: SpecimenTestsService,
  ) {}

  async list(
    tenantId: string,
    projectId: string,
    query: ListFieldRecordsQueryDto,
  ): Promise<PaginatedResult<FieldRecordSummary>> {
    await this.projects.assertExists(tenantId, projectId);
    const q = searchTerm(query.q);
    const where: Prisma.FieldRecordWhereInput = {
      tenantId,
      projectId,
      ...(query.status && { status: query.status }),
      ...(q && {
        OR: [
          { castElement: { contains: q, mode: 'insensitive' } },
          { programmedElement: { contains: q, mode: 'insensitive' } },
        ],
      }),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.fieldRecord.findMany({
        where,
        orderBy: [{ pourDate: 'desc' }, { registrySequence: 'desc' }],
        include: {
          deliveries: {
            select: { samples: { select: { _count: { select: { specimens: true } } } } },
          },
        },
        ...skipTake(query),
      }),
      this.prisma.fieldRecord.count({ where }),
    ]);
    return paginated(rows.map(toSummary), total, query);
  }

  async get(tenantId: string, id: string): Promise<FieldRecordDetail> {
    const record = await this.prisma.fieldRecord.findFirst({
      where: { id, tenantId },
      include: DETAIL_INCLUDE,
    });
    if (!record) throw new NotFoundException('Field record not found');
    const project = await this.projects.summary(tenantId, record.projectId);
    const specimenIds = record.deliveries.flatMap((d) =>
      d.samples.flatMap((s) => s.specimens.map((sp) => sp.id)),
    );
    const tests = await this.specimenTests.briefsForSpecimens(tenantId, specimenIds);
    return toDetail(record, project, tests);
  }

  /** Next free numbers in the project (Q-55, Q-57, Q-58), proposed to the user. */
  async nextNumbers(tenantId: string, projectId: string): Promise<NextNumbers> {
    await this.projects.assertExists(tenantId, projectId);
    const [records, samples, specimens] = await this.prisma.$transaction([
      this.prisma.fieldRecord.aggregate({
        where: { tenantId, projectId },
        _max: { registrySequence: true },
      }),
      this.prisma.sample.aggregate({
        where: { tenantId, projectId },
        _max: { sampleNumber: true },
      }),
      this.prisma.specimen.aggregate({
        where: { tenantId, projectId },
        _max: { specimenNumber: true },
      }),
    ]);
    return {
      registrySequence: nextNumber(records._max.registrySequence),
      sampleNumber: nextNumber(samples._max.sampleNumber),
      specimenNumber: nextNumber(specimens._max.specimenNumber),
    };
  }

  /** New DRAFT. Without `registrySequence` it takes the project's next number. */
  async create(
    tenantId: string,
    projectId: string,
    dto: CreateFieldRecordDto,
    createdById: string,
  ): Promise<FieldRecordDetail> {
    await this.projects.assertExists(tenantId, projectId);
    const pourDate = calendarDateToDb(parseDate(dto.pourDate));

    for (let attempt = 1; ; attempt++) {
      const registrySequence =
        dto.registrySequence ?? (await this.nextNumbers(tenantId, projectId)).registrySequence;
      try {
        const record = await this.prisma.fieldRecord.create({
          data: {
            tenantId,
            projectId,
            pourDate,
            registrySequence,
            frontNumber: dto.frontNumber ?? 1,
            createdById,
          },
        });
        return await this.get(tenantId, record.id);
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        // A chosen number is taken: report it. An automatic one raced: try the next.
        if (dto.registrySequence !== undefined || attempt >= UNIQUE_RETRIES) {
          throw new ConflictException(
            `Registro ${formatRegistryNumber(registrySequence)} already exists in this project`,
          );
        }
      }
    }
  }

  /**
   * Replaces the whole form while the record is DRAFT: header, deliveries, samples,
   * specimens. Nested rows are recreated, so their ids change on every save; nothing
   * references them before the record is completed (tests are planned then).
   */
  async replaceForm(
    tenantId: string,
    id: string,
    dto: FieldRecordFormDto,
  ): Promise<FieldRecordDetail> {
    const record = await this.prisma.fieldRecord.findFirst({
      where: { id, tenantId },
      select: { id: true, projectId: true, status: true },
    });
    if (!record) throw new NotFoundException('Field record not found');
    if (record.status !== 'DRAFT') {
      throw new ConflictException('Only a DRAFT field record can be edited');
    }

    this.assertNoDuplicateNumbers(dto.deliveries);
    await this.assertCatalogEntries(tenantId, dto);
    const pourDate = calendarDateToDb(parseDate(dto.pourDate));
    const { projectId } = record;

    try {
      await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.fieldRecord.updateMany({
          where: { id, tenantId, status: 'DRAFT' },
          data: headerData(dto, pourDate),
        });
        if (count !== 1) throw new ConflictException('Only a DRAFT field record can be edited');

        await tx.specimen.deleteMany({
          where: { tenantId, sample: { delivery: { fieldRecordId: id } } },
        });
        await tx.sample.deleteMany({ where: { tenantId, delivery: { fieldRecordId: id } } });
        await tx.delivery.deleteMany({ where: { tenantId, fieldRecordId: id } });

        for (const [index, delivery] of dto.deliveries.entries()) {
          const created = await tx.delivery.create({
            data: { tenantId, fieldRecordId: id, sequence: index + 1, ...deliveryData(delivery) },
          });
          for (const sample of delivery.samples) {
            const createdSample = await tx.sample.create({
              data: {
                tenantId,
                projectId,
                deliveryId: created.id,
                sampleNumber: sample.sampleNumber ?? null,
                specimenType: sample.specimenType ?? null,
                moldedAt: time(sample.moldedAt),
              },
            });
            await tx.specimen.createMany({
              data: sample.specimens.map((specimen) => ({
                tenantId,
                projectId,
                sampleId: createdSample.id,
                specimenNumber: specimen.specimenNumber ?? null,
                moldCode: specimen.moldCode ?? null,
              })),
            });
          }
        }
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'A registro, sample or specimen number is already used in this project',
        );
      }
      throw error;
    }
    return this.get(tenantId, id);
  }

  /**
   * DRAFT → COMPLETED once everything on the lab's example is filled in (Q-33), else
   * 422 with the missing items. In the same transaction, every specimen gets a
   * SCHEDULED test with the project's default ages (Q-20, development-plan 6.4).
   */
  async complete(tenantId: string, id: string): Promise<FieldRecordDetail> {
    const record = await this.get(tenantId, id);
    this.assertTransition(record.status, 'COMPLETED');
    if (record.missingForCompletion.length > 0) {
      throw new UnprocessableEntityException({
        message: 'The field record is incomplete',
        details: record.missingForCompletion,
      });
    }
    const ages = await this.projects.testConfiguration(tenantId, record.project.id);
    if (ages.length === 0) {
      throw new UnprocessableEntityException({
        message: 'The project has no test ages configured',
        details: ['testAges'],
      });
    }
    const samples = record.deliveries.flatMap((d) =>
      d.samples.map((s) => ({
        // Complete records have every specimen numbered (missingForCompletion).
        specimens: s.specimens.map((sp) => ({ id: sp.id, specimenNumber: sp.specimenNumber ?? 0 })),
      })),
    );
    await this.prisma.$transaction(async (tx) => {
      await this.setStatus(tenantId, id, record.status, 'COMPLETED', tx);
      await this.specimenTests.planForSamples(tx, tenantId, samples, ages);
    });
    return this.get(tenantId, id);
  }

  /** DRAFT → CANCELLED. Completed records are corrected, not cancelled (Q-34). */
  async cancel(tenantId: string, id: string): Promise<FieldRecordDetail> {
    const record = await this.get(tenantId, id);
    this.assertTransition(record.status, 'CANCELLED');
    await this.setStatus(tenantId, id, record.status, 'CANCELLED');
    return this.get(tenantId, id);
  }

  /**
   * Cancels one specimen of a completed record (e.g. damaged in transport) and its
   * open tests, in one transaction. A specimen already tested can't be cancelled.
   * Returns the record it belongs to.
   */
  async cancelSpecimen(tenantId: string, specimenId: string): Promise<FieldRecordDetail> {
    const specimen = await this.prisma.specimen.findFirst({
      where: { id: specimenId, tenantId },
      select: {
        status: true,
        sample: { select: { delivery: { select: { fieldRecordId: true } } } },
      },
    });
    if (!specimen) throw new NotFoundException('Specimen not found');
    if (specimen.status === 'CANCELLED') {
      throw new ConflictException('The specimen is already cancelled');
    }

    await this.prisma.$transaction(async (tx) => {
      const ok = await this.specimenTests.cancelOpenTestsOfSpecimen(tx, tenantId, specimenId);
      if (!ok) throw new ConflictException('The specimen was already tested');
      const { count } = await tx.specimen.updateMany({
        where: { id: specimenId, tenantId, status: 'CREATED' },
        data: { status: 'CANCELLED' },
      });
      if (count !== 1) throw new ConflictException('The specimen changed; reload it');
    });
    return this.get(tenantId, specimen.sample.delivery.fieldRecordId);
  }

  private assertTransition(from: FieldRecordStatus, to: FieldRecordStatus): void {
    try {
      assertFieldRecordTransition(from, to);
    } catch (error) {
      if (error instanceof InvalidTransitionError) throw new ConflictException(error.message);
      throw error;
    }
  }

  /** Conditional on the status read, so two concurrent transitions can't both win. */
  private async setStatus(
    tenantId: string,
    id: string,
    from: FieldRecordStatus,
    to: FieldRecordStatus,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    const { count } = await tx.fieldRecord.updateMany({
      where: { id, tenantId, status: from },
      data: { status: to },
    });
    if (count !== 1) throw new ConflictException('The field record changed; reload it');
  }

  private assertNoDuplicateNumbers(deliveries: readonly DeliveryFormDto[]): void {
    const samples = deliveries.flatMap((d) => d.samples);
    const dupSamples = duplicateNumbers(samples.map((s) => s.sampleNumber));
    const dupSpecimens = duplicateNumbers(
      samples.flatMap((s) => s.specimens.map((sp) => sp.specimenNumber)),
    );
    const details = [
      ...dupSamples.map((n) => `sample number ${n} is repeated`),
      ...dupSpecimens.map((n) => `specimen number ${n} is repeated`),
    ];
    if (details.length > 0) {
      throw new BadRequestException(details);
    }
  }

  private async assertCatalogEntries(tenantId: string, dto: FieldRecordFormDto): Promise<void> {
    if (dto.supplierId) await this.catalogs.assertExists(tenantId, 'suppliers', dto.supplierId);
    const cementIds = new Set(
      [dto.cementTypeId, ...dto.deliveries.map((d) => d.ticketCementTypeId)].filter(
        (v): v is string => typeof v === 'string',
      ),
    );
    for (const cementId of cementIds) {
      await this.catalogs.assertExists(tenantId, 'cementTypes', cementId);
    }
  }
}

function parseDate(value: string): CalendarDate {
  try {
    return parseCalendarDate(value);
  } catch (error) {
    if (error instanceof InvalidCalendarDateError) throw new BadRequestException([error.message]);
    throw error;
  }
}

function time(value: string | null | undefined): Date | null {
  return value ? timeOfDayToDb(parseTimeOfDay(value)) : null;
}

function headerData(
  dto: FieldRecordFormDto,
  pourDate: Date,
): Prisma.FieldRecordUncheckedUpdateManyInput {
  return {
    registrySequence: dto.registrySequence ?? null,
    frontNumber: dto.frontNumber ?? 1,
    pourDate,
    supplierId: dto.supplierId ?? null,
    production: dto.production ?? null,
    strengthCriterion: dto.strengthCriterion ?? null,
    specifiedStrengthKgCm2: dto.specifiedStrengthKgCm2 ?? null,
    specifiedSlumpCm: dto.specifiedSlumpCm ?? null,
    specifiedSlumpToleranceCm: dto.specifiedSlumpToleranceCm ?? null,
    maxAggregateSizeMm: dto.maxAggregateSizeMm ?? null,
    cementTypeId: dto.cementTypeId ?? null,
    designAgeDays: dto.designAgeDays ?? null,
    screened: dto.screened ?? null,
    screenMesh: dto.screenMesh ?? null,
    skyCondition: dto.skyCondition ?? null,
    windCondition: dto.windCondition ?? null,
    lightingCondition: dto.lightingCondition ?? null,
    relativeHumidityPct: dto.relativeHumidityPct ?? null,
    thermometerCode: dto.thermometerCode ?? null,
    hygrometerCode: dto.hygrometerCode ?? null,
    slumpConeCode: dto.slumpConeCode ?? null,
    tapeMeasureCode: dto.tapeMeasureCode ?? null,
    strikeOffBarCode: dto.strikeOffBarCode ?? null,
    slumpRodCode: dto.slumpRodCode ?? null,
    samplingRodCode: dto.samplingRodCode ?? null,
    wheelbarrowCode: dto.wheelbarrowCode ?? null,
    unitWeightScaleCode: dto.unitWeightScaleCode ?? null,
    unitWeightMoldCode: dto.unitWeightMoldCode ?? null,
    unitWeightTareG: dto.unitWeightTareG ?? null,
    unitWeightTareSampleG: dto.unitWeightTareSampleG ?? null,
    unitWeightMoldFactor: dto.unitWeightMoldFactor ?? null,
    airMeterCode: dto.airMeterCode ?? null,
    airContentPct: dto.airContentPct ?? null,
    programmedElement: dto.programmedElement ?? null,
    castElement: dto.castElement ?? null,
    observations: dto.observations ?? null,
    samplerName: dto.samplerName ?? null,
    approvedByName: dto.approvedByName ?? null,
  };
}

function deliveryData(d: DeliveryFormDto) {
  return {
    ticketNumber: d.ticketNumber ?? null,
    volumeM3: d.volumeM3 ?? null,
    plantDepartureTime: time(d.plantDepartureTime),
    siteArrivalTime: time(d.siteArrivalTime),
    pourStartTime: time(d.pourStartTime),
    pourEndTime: time(d.pourEndTime),
    ambientTemperatureC: d.ambientTemperatureC ?? null,
    concreteTemperatureC: d.concreteTemperatureC ?? null,
    slump1Cm: d.slump1Cm ?? null,
    slump2Cm: d.slump2Cm ?? null,
    ticketStrengthKgCm2: d.ticketStrengthKgCm2 ?? null,
    ticketSlumpCm: d.ticketSlumpCm ?? null,
    ticketSlumpToleranceCm: d.ticketSlumpToleranceCm ?? null,
    ticketMaxAggregateMm: d.ticketMaxAggregateMm ?? null,
    ticketCementTypeId: d.ticketCementTypeId ?? null,
    ticketDesignAgeDays: d.ticketDesignAgeDays ?? null,
  };
}
