import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AuthService } from '../auth/auth.service.js';
import { ClientsService } from '../clients/clients.service.js';
import { formatRegistryNumber } from '../field-records/domain/numbering.js';
import { FieldRecordsService } from '../field-records/field-records.service.js';
import type { Prisma, Report } from '../generated/prisma/client.js';
import { CalendarDate, calendarDateFromDb } from '../shared/dates/calendar-date.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';
import { SpecimenTestsService } from '../specimen-tests/specimen-tests.service.js';
import {
  assembleConcreteControl,
  missingForReport,
  ReportNotReadyError,
  type ReportInput,
  SNAPSHOT_SCHEMA_VERSION,
  TEMPLATE_KEY,
  TEMPLATE_VERSION,
} from './domain/concrete-control.js';
import type { ReportFieldsDto } from './dto/report.dto.js';
import { ReportRenderer } from './rendering/report-renderer.js';
import { ReportStorage } from './storage/report-storage.js';
import { renderConcreteControlHtml } from './templates/concrete-control.js';

const FIELD_KEYS = [
  'mixingEquipment',
  'compactionMethod',
  'mixDesignReference',
  'admixture',
  'observations',
] as const;

export interface ReportView {
  id: string;
  fieldRecord: {
    id: string;
    registryNumber: string | null;
    pourDate: CalendarDate;
    castElement: string | null;
  };
  project: { id: string; name: string; code: string | null };
  templateKey: string;
  version: number;
  status: Report['status'];
  reportNumber: string | null;
  mixingEquipment: string | null;
  compactionMethod: string | null;
  mixDesignReference: string | null;
  admixture: string | null;
  observations: string | null;
  hasPdf: boolean;
  contentSha256: string | null;
  generatedAt: Date | null;
  finalizedAt: Date | null;
  /** A later corrected version replaced this FINAL one (Q-36). */
  supersededAt: Date | null;
  createdAt: Date;
}

export interface RecordReports {
  /** What still blocks a full report (Q-35); empty when ready. */
  missing: string[];
  reports: ReportView[];
}

const VIEW_INCLUDE = {
  fieldRecord: {
    select: {
      id: true,
      registrySequence: true,
      pourDate: true,
      castElement: true,
      project: { select: { id: true, name: true, code: true } },
    },
  },
} satisfies Prisma.ReportInclude;

type ReportRow = Prisma.ReportGetPayload<{ include: typeof VIEW_INCLUDE }>;

function toView(r: ReportRow): ReportView {
  const seq = r.fieldRecord.registrySequence;
  return {
    id: r.id,
    fieldRecord: {
      id: r.fieldRecord.id,
      registryNumber: seq === null ? null : formatRegistryNumber(seq),
      pourDate: calendarDateFromDb(r.fieldRecord.pourDate),
      castElement: r.fieldRecord.castElement,
    },
    project: r.fieldRecord.project,
    templateKey: r.templateKey,
    version: r.version,
    status: r.status,
    reportNumber: r.reportNumber,
    mixingEquipment: r.mixingEquipment,
    compactionMethod: r.compactionMethod,
    mixDesignReference: r.mixDesignReference,
    admixture: r.admixture,
    observations: r.observations,
    hasPdf: r.storageKey !== null,
    contentSha256: r.contentSha256,
    generatedAt: r.generatedAt,
    finalizedAt: r.finalizedAt,
    supersededAt: r.supersededAt,
    createdAt: r.createdAt,
  };
}

/**
 * Owns `reports` (ADR-005). One report per field record (FPC06-04), versioned: a
 * correction is a new version with the same number, and finalizing it supersedes the
 * previous FINAL one (Q-36). Source data comes from the owning modules' services.
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly clients: ClientsService,
    private readonly fieldRecords: FieldRecordsService,
    private readonly specimenTests: SpecimenTestsService,
    @Inject(ReportRenderer) private readonly renderer: ReportRenderer,
    @Inject(ReportStorage) private readonly storage: ReportStorage,
  ) {}

  async list(tenantId: string, projectId?: string): Promise<ReportView[]> {
    const rows = await this.prisma.report.findMany({
      where: { tenantId, ...(projectId && { fieldRecord: { projectId } }) },
      include: VIEW_INCLUDE,
      orderBy: [{ createdAt: 'desc' }],
    });
    return rows.map(toView);
  }

  /** For the dashboard (8.4): versions not yet issued (DRAFT or GENERATED). */
  countPending(tenantId: string): Promise<number> {
    return this.prisma.report.count({ where: { tenantId, status: { not: 'FINAL' } } });
  }

  async forRecord(tenantId: string, fieldRecordId: string): Promise<RecordReports> {
    const input = await this.loadInput(tenantId, fieldRecordId, emptyFields());
    const rows = await this.prisma.report.findMany({
      where: { tenantId, fieldRecordId, templateKey: TEMPLATE_KEY },
      include: VIEW_INCLUDE,
      orderBy: { version: 'desc' },
    });
    return { missing: missingForReport(input), reports: rows.map(toView) };
  }

  /** A new DRAFT: the first report of the record, or a correction of the FINAL one. */
  async create(tenantId: string, fieldRecordId: string, dto: ReportFieldsDto): Promise<ReportView> {
    const record = await this.fieldRecords.get(tenantId, fieldRecordId);
    if (record.status !== 'COMPLETED') {
      throw new UnprocessableEntityException({
        message: 'Only completed field records get a report',
        details: ['record.status'],
      });
    }
    const versions = await this.prisma.report.findMany({
      where: { tenantId, fieldRecordId, templateKey: TEMPLATE_KEY },
      orderBy: { version: 'desc' },
    });
    const latest = versions[0];
    if (latest && latest.status !== 'FINAL') {
      throw new ConflictException('This record already has a report in progress');
    }
    const defaults = latest ?? (await this.latestOfProject(tenantId, record.project.id));
    const fields = Object.fromEntries(
      FIELD_KEYS.map((k) => [k, dto[k] !== undefined ? clean(dto[k]) : (defaults?.[k] ?? null)]),
    );
    if (!latest && dto.observations === undefined) fields.observations = null;
    const created = await this.prisma.report.create({
      data: {
        tenantId,
        fieldRecordId,
        templateKey: TEMPLATE_KEY,
        version: (latest?.version ?? 0) + 1,
        reportNumber: latest?.reportNumber ?? null,
        ...fields,
      },
      include: VIEW_INCLUDE,
    });
    return toView(created);
  }

  /** Edits the author's fields while not FINAL; a generated PDF must be regenerated. */
  async update(tenantId: string, id: string, dto: ReportFieldsDto): Promise<ReportView> {
    const report = await this.find(tenantId, id);
    if (report.status === 'FINAL') throw new ConflictException('A FINAL report is immutable');
    const data = Object.fromEntries(
      FIELD_KEYS.filter((k) => dto[k] !== undefined).map((k) => [k, clean(dto[k])]),
    );
    const { count } = await this.prisma.report.updateMany({
      where: { id, tenantId, status: { not: 'FINAL' } },
      data: { ...data, status: 'DRAFT' },
    });
    if (count !== 1) throw new ConflictException('A FINAL report is immutable');
    return this.view(tenantId, id);
  }

  /** Freezes the snapshot, renders the PDF and stores it with its checksum (ADR-005). */
  async generate(tenantId: string, userId: string, id: string): Promise<ReportView> {
    const report = await this.find(tenantId, id);
    if (report.status === 'FINAL') throw new ConflictException('A FINAL report is immutable');
    const input = await this.loadInput(tenantId, report.fieldRecordId, {
      mixingEquipment: report.mixingEquipment,
      compactionMethod: report.compactionMethod,
      mixDesignReference: report.mixDesignReference,
      admixture: report.admixture,
      observations: report.observations,
    });
    const profile = await this.auth.tenantProfile(tenantId);
    let snapshot;
    try {
      snapshot = assembleConcreteControl(input, {
        version: report.version,
        issueDate: profile.today,
      });
    } catch (error) {
      if (error instanceof ReportNotReadyError) {
        throw new UnprocessableEntityException({
          message: 'The record is not ready for a report',
          details: error.missing,
        });
      }
      throw error;
    }
    // A correction keeps the number of the first version (Q-36).
    if (report.reportNumber) snapshot.reportNumber = report.reportNumber;

    const pdf = await this.renderer.render(renderConcreteControlHtml(snapshot));
    const storageKey = `${tenantId}/${report.id}.pdf`;
    await this.storage.put(storageKey, pdf);
    const { count } = await this.prisma.report.updateMany({
      where: { id, tenantId, status: { not: 'FINAL' } },
      data: {
        status: 'GENERATED',
        reportNumber: snapshot.reportNumber,
        templateVersion: TEMPLATE_VERSION,
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
        snapshotSchemaVersion: SNAPSHOT_SCHEMA_VERSION,
        storageKey,
        contentSha256: createHash('sha256').update(pdf).digest('hex'),
        generatedAt: new Date(),
        generatedById: userId,
      },
    });
    if (count !== 1) throw new ConflictException('A FINAL report is immutable');
    return this.view(tenantId, id);
  }

  /**
   * Issues the report (FINAL is immutable). Only the Jefe de Control de Calidad reaches
   * this: the route needs `reports.issue` (Q-40).
   */
  async finalize(tenantId: string, userId: string, id: string): Promise<ReportView> {
    const report = await this.find(tenantId, id);
    if (report.status !== 'GENERATED') {
      throw new ConflictException(
        report.status === 'FINAL' ? 'The report is already FINAL' : 'Generate the PDF first',
      );
    }
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.report.updateMany({
        where: { id, tenantId, status: 'GENERATED' },
        data: { status: 'FINAL', finalizedAt: now, finalizedById: userId },
      });
      if (count !== 1) throw new ConflictException('The report changed meanwhile');
      await tx.report.updateMany({
        where: {
          tenantId,
          fieldRecordId: report.fieldRecordId,
          templateKey: report.templateKey,
          status: 'FINAL',
          supersededAt: null,
          version: { lt: report.version },
        },
        data: { supersededAt: now },
      });
    });
    return this.view(tenantId, id);
  }

  async pdf(tenantId: string, id: string): Promise<{ file: Buffer; name: string }> {
    const report = await this.find(tenantId, id);
    if (!report.storageKey) throw new NotFoundException('The report has no PDF yet');
    const file = await this.storage.get(report.storageKey);
    const suffix = report.version > 1 ? `-v${report.version}` : '';
    return { file, name: `${report.reportNumber ?? report.id}${suffix}.pdf` };
  }

  private async find(tenantId: string, id: string): Promise<Report> {
    const report = await this.prisma.report.findFirst({ where: { id, tenantId } });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  private async view(tenantId: string, id: string): Promise<ReportView> {
    return toView(
      await this.prisma.report.findFirstOrThrow({ where: { id, tenantId }, include: VIEW_INCLUDE }),
    );
  }

  private latestOfProject(tenantId: string, projectId: string): Promise<Report | null> {
    return this.prisma.report.findFirst({
      where: { tenantId, fieldRecord: { projectId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Report data from the owning modules (field records, clients, tests, tenant). */
  private async loadInput(
    tenantId: string,
    fieldRecordId: string,
    fields: ReportInput['fields'],
  ): Promise<ReportInput> {
    const record = await this.fieldRecords.get(tenantId, fieldRecordId);
    const client = await this.clients.get(tenantId, record.project.client.id);
    const profile = await this.auth.tenantProfile(tenantId);
    const specimens = record.deliveries.flatMap((d) =>
      d.samples.flatMap((s) => s.specimens.filter((sp) => sp.status !== 'CANCELLED')),
    );
    const readings = await this.specimenTests.readingsForSpecimens(
      tenantId,
      specimens.map((sp) => sp.id),
    );
    const bySpecimen = new Map(readings.map((r) => [r.specimenId, r]));

    return {
      lab: {
        name: profile.name,
        legalName: profile.legalName,
        address: profile.address,
        phone: profile.phone,
      },
      project: { name: record.project.name, code: record.project.code },
      client: {
        name: client.name,
        code: client.code,
        contactName: client.contactName,
        contactPhone: client.contactPhone,
      },
      record: {
        status: record.status,
        registrySequence: record.registrySequence,
        frontNumber: record.frontNumber,
        pourDate: record.pourDate,
        castElement: record.castElement,
        specifiedStrengthKgCm2: record.specifiedStrengthKgCm2,
        specifiedSlumpCm: record.specifiedSlumpCm,
        specifiedSlumpToleranceCm: record.specifiedSlumpToleranceCm,
        supplier: record.supplier?.name ?? null,
        cementType: record.cementType?.name ?? null,
      },
      samples: record.deliveries.flatMap((d) =>
        d.samples.map((s) => ({
          sampleNumber: s.sampleNumber,
          moldedAt: s.moldedAt,
          siteArrivalTime: d.siteArrivalTime,
          concreteTemperatureC: d.concreteTemperatureC,
          slump1Cm: d.slump1Cm,
          slump2Cm: d.slump2Cm,
          tests: s.specimens
            .filter((sp) => sp.status !== 'CANCELLED')
            .flatMap((sp) => {
              const t = bySpecimen.get(sp.id);
              if (!t) return [];
              return [
                {
                  specimenNumber: sp.specimenNumber,
                  ageDays: t.ageDays,
                  testDate: t.testDate,
                  testTime: t.testTime,
                  height1Cm: t.height1Cm,
                  height2Cm: t.height2Cm,
                  diameter1Cm: t.diameter1Cm,
                  diameter2Cm: t.diameter2Cm,
                  maxLoadKgf: t.maxLoadKgf,
                  failureType: t.failureType,
                  completed:
                    t.status === 'COMPLETED' &&
                    [t.height1Cm, t.height2Cm, t.diameter1Cm, t.diameter2Cm, t.maxLoadKgf].every(
                      (v) => v !== null,
                    ),
                },
              ];
            }),
        })),
      ),
      fields,
    };
  }
}

function emptyFields(): ReportInput['fields'] {
  return {
    mixingEquipment: null,
    compactionMethod: null,
    mixDesignReference: null,
    admixture: null,
    observations: null,
  };
}

function clean(v: string | null | undefined): string | null {
  return v === null || v === undefined || v.trim() === '' ? null : v.trim();
}
