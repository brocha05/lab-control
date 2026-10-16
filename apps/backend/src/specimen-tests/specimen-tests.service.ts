import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { ProjectsService, type ProjectView } from '../projects/projects.service.js';
import { HolidaysService } from '../catalogs/holidays.service.js';
import type { Prisma, SpecimenTestStatus, SpecimenType } from '../generated/prisma/client.js';
import {
  addDays,
  CalendarDate,
  calendarDateFromDb,
  calendarDateToDb,
  compareCalendarDates,
  InvalidCalendarDateError,
  parseCalendarDate,
} from '../shared/dates/calendar-date.js';
import { parseTimeOfDay, timeOfDayFromDb, timeOfDayToDb } from '../shared/dates/time-of-day.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';
import { computeCompression } from './domain/compression.js';
import { assignSpecimensToAges, type TestAgeRule } from './domain/test-schedule.js';
import type { PendingTestsQueryDto } from './dto/pending-tests.dto.js';
import type { RescheduleTestDto } from './dto/reschedule-test.dto.js';
import type { SaveTestResultsDto, WorksheetQueryDto } from './dto/worksheet.dto.js';
import { buildPendingList, type PendingCandidate, type PendingTest } from './pending-tests.js';
import { buildWorksheet, type Worksheet, type WorksheetCandidate } from './worksheet.js';

const DEFAULT_WINDOW_DAYS = 7;
/** A shift past Sundays and holidays never exceeds a few days; load holidays with margin. */
const HOLIDAY_MARGIN_DAYS = 14;

/** A sample's specimens, as the field-records module hands them over for planning. */
export interface SampleToPlan {
  specimens: { id: string; specimenNumber: number }[];
}

export interface SpecimenTestBrief {
  id: string;
  specimenId: string;
  ageDays: number;
  keepExactDate: boolean;
  status: SpecimenTestStatus;
  testDate: CalendarDate | null;
  /** Derived from the readings once completed (ADR-008). */
  stressKgCm2: number | null;
  percentOfDesign: number | null;
}

const BRIEF_SELECT = {
  id: true,
  specimenId: true,
  ageDays: true,
  keepExactDate: true,
  status: true,
  testDate: true,
  height1Cm: true,
  height2Cm: true,
  diameter1Cm: true,
  diameter2Cm: true,
  maxLoadKgf: true,
} as const;

type BriefRow = Prisma.SpecimenTestGetPayload<{ select: typeof BRIEF_SELECT }>;

function toBrief(r: BriefRow, designStrengthKgCm2: number | null = null): SpecimenTestBrief {
  const readings = [r.height1Cm, r.height2Cm, r.diameter1Cm, r.diameter2Cm, r.maxLoadKgf];
  const result =
    r.status === 'COMPLETED' && designStrengthKgCm2 !== null && readings.every((v) => v !== null)
      ? computeCompression(
          {
            height1Cm: r.height1Cm!.toNumber(),
            height2Cm: r.height2Cm!.toNumber(),
            diameter1Cm: r.diameter1Cm!.toNumber(),
            diameter2Cm: r.diameter2Cm!.toNumber(),
            maxLoadKgf: r.maxLoadKgf!.toNumber(),
          },
          designStrengthKgCm2,
        )
      : null;
  return {
    id: r.id,
    specimenId: r.specimenId,
    ageDays: r.ageDays,
    keepExactDate: r.keepExactDate,
    status: r.status,
    testDate: r.testDate ? calendarDateFromDb(r.testDate) : null,
    stressKgCm2: result?.stressKgCm2 ?? null,
    percentOfDesign: result?.percentOfDesign ?? null,
  };
}

/**
 * Owns `specimen_tests`. Every method takes `tenantId` first.
 *
 * The pending list is a documented read query (like the Bitácora, ADR-004): it reads
 * specimens, samples, deliveries, field records and projects through Prisma relations,
 * never writes them.
 */
@Injectable()
export class SpecimenTestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly holidays: HolidaysService,
    private readonly projects: ProjectsService,
  ) {}

  /**
   * Open tests (SCHEDULED / IN_PROGRESS) whose scheduled date is on or before `until`,
   * overdue ones included, with their derived dates and due status (6.5).
   * At the lab's volume (A-50) the open tests fit in memory, so dates are derived here.
   */
  async pending(tenantId: string, query: PendingTestsQueryDto): Promise<PendingTest[]> {
    const today = await this.auth.tenantToday(tenantId);
    const until = query.until ? parseDate(query.until) : addDays(today, DEFAULT_WINDOW_DAYS);

    const rows = await this.prisma.specimenTest.findMany({
      where: {
        tenantId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        specimen: {
          status: 'CREATED',
          ...(query.projectId && { projectId: query.projectId }),
        },
      },
      include: {
        specimen: {
          include: {
            project: { select: { id: true, name: true, code: true } },
            sample: {
              include: {
                delivery: {
                  include: {
                    fieldRecord: {
                      select: {
                        id: true,
                        registrySequence: true,
                        pourDate: true,
                        castElement: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const candidates: PendingCandidate[] = rows.map((r) => {
      const { specimen } = r;
      const record = specimen.sample.delivery.fieldRecord;
      return {
        id: r.id,
        status: r.status as PendingCandidate['status'],
        ageDays: r.ageDays,
        keepExactDate: r.keepExactDate,
        specimen: {
          id: specimen.id,
          specimenNumber: specimen.specimenNumber,
          moldCode: specimen.moldCode,
        },
        sample: {
          sampleNumber: specimen.sample.sampleNumber,
          moldedAt: specimen.sample.moldedAt ? timeOfDayFromDb(specimen.sample.moldedAt) : null,
        },
        fieldRecord: {
          id: record.id,
          registrySequence: record.registrySequence,
          pourDate: calendarDateFromDb(record.pourDate),
          castElement: record.castElement,
        },
        project: specimen.project,
      };
    });
    if (candidates.length === 0) return [];

    const earliest = candidates
      .map((c) => addDays(c.fieldRecord.pourDate, c.ageDays))
      .reduce((min, d) => (compareCalendarDates(d, min) < 0 ? d : min));
    const holidays = await this.holidays.holidaySet(
      tenantId,
      earliest,
      addDays(until, HOLIDAY_MARGIN_DAYS),
    );
    return buildPendingList(candidates, today, until, (d) => holidays.has(d));
  }

  /**
   * Plans one SCHEDULED test per specimen with the project's default ages (Q-20),
   * ascending specimen numbers to ascending ages (Q-14, A-82). Runs inside the
   * transaction that completes the field record, so both happen or neither does.
   */
  async planForSamples(
    tx: Prisma.TransactionClient,
    tenantId: string,
    samples: readonly SampleToPlan[],
    ages: readonly TestAgeRule[],
  ): Promise<number> {
    const data = samples.flatMap((sample) => {
      const idByNumber = new Map(sample.specimens.map((s) => [s.specimenNumber, s.id]));
      return assignSpecimensToAges([...idByNumber.keys()], ages).map((a) => ({
        tenantId,
        specimenId: idByNumber.get(a.specimenNumber) as string,
        ageDays: a.ageDays,
      }));
    });
    if (data.length === 0) return 0;
    const { count } = await tx.specimenTest.createMany({ data });
    return count;
  }

  /**
   * Changes a test's age or exact-date flag while it isn't completed or cancelled
   * (Q-22). The scheduled date follows, since it is derived.
   */
  async reschedule(
    tenantId: string,
    id: string,
    dto: RescheduleTestDto,
  ): Promise<SpecimenTestBrief> {
    const test = await this.prisma.specimenTest.findFirst({
      where: { id, tenantId },
      select: { status: true },
    });
    if (!test) throw new NotFoundException('Test not found');
    const { count } = await this.prisma.specimenTest.updateMany({
      where: { id, tenantId, status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
      data: { ageDays: dto.ageDays, keepExactDate: dto.keepExactDate },
    });
    if (count !== 1) {
      throw new ConflictException(`A ${test.status} test can't be rescheduled`);
    }
    return toBrief(
      await this.prisma.specimenTest.findFirstOrThrow({
        where: { id, tenantId },
        select: BRIEF_SELECT,
      }),
    );
  }

  /**
   * The FPC06-01 worksheet of a project and test date (7.4): open tests due on or before
   * the date and the tests completed on it, grouped by record and sample, with the
   * results derived from the readings (ADR-008). Compression of cylinders only (A-87).
   */
  async worksheet(
    tenantId: string,
    query: WorksheetQueryDto,
  ): Promise<Worksheet & { project: ProjectView }> {
    const testDate = parseDate(query.testDate);
    const project = await this.projects.get(tenantId, query.projectId);

    const rows = await this.prisma.specimenTest.findMany({
      where: {
        tenantId,
        OR: [
          { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
          { status: 'COMPLETED', testDate: calendarDateToDb(testDate) },
        ],
        specimen: {
          status: 'CREATED',
          projectId: project.id,
          sample: { OR: [{ specimenType: null }, { specimenType: { in: CYLINDERS } }] },
        },
      },
      include: {
        specimen: {
          include: {
            sample: {
              include: {
                delivery: {
                  include: {
                    fieldRecord: {
                      select: {
                        id: true,
                        registrySequence: true,
                        pourDate: true,
                        castElement: true,
                        specifiedStrengthKgCm2: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const candidates: WorksheetCandidate[] = rows.map((r) => {
      const { specimen } = r;
      const { sample } = specimen;
      const record = sample.delivery.fieldRecord;
      return {
        id: r.id,
        status: r.status as WorksheetCandidate['status'],
        ageDays: r.ageDays,
        keepExactDate: r.keepExactDate,
        testDate: r.testDate ? calendarDateFromDb(r.testDate) : null,
        testTime: r.testTime ? timeOfDayFromDb(r.testTime) : null,
        readings: {
          height1Cm: num(r.height1Cm),
          height2Cm: num(r.height2Cm),
          diameter1Cm: num(r.diameter1Cm),
          diameter2Cm: num(r.diameter2Cm),
          maxLoadKgf: num(r.maxLoadKgf),
          loadDurationS: r.loadDurationS,
          failureType: r.failureType,
        },
        pressCode: r.pressCode,
        dimensionEquipment: r.dimensionEquipment,
        specimen: {
          id: specimen.id,
          specimenNumber: specimen.specimenNumber,
          moldCode: specimen.moldCode,
        },
        sample: {
          id: sample.id,
          sampleNumber: sample.sampleNumber,
          moldedAt: sample.moldedAt ? timeOfDayFromDb(sample.moldedAt) : null,
        },
        siteArrivalTime: sample.delivery.siteArrivalTime
          ? timeOfDayFromDb(sample.delivery.siteArrivalTime)
          : null,
        fieldRecord: {
          id: record.id,
          registrySequence: record.registrySequence,
          pourDate: calendarDateFromDb(record.pourDate),
          castElement: record.castElement,
          specifiedStrengthKgCm2: num(record.specifiedStrengthKgCm2),
        },
      };
    });

    const earliest = candidates
      .map((c) => addDays(c.fieldRecord.pourDate, c.ageDays))
      .reduce((min, d) => (compareCalendarDates(d, min) < 0 ? d : min), testDate);
    const holidays = await this.holidays.holidaySet(
      tenantId,
      earliest,
      addDays(testDate, HOLIDAY_MARGIN_DAYS),
    );
    return { project, ...buildWorksheet(candidates, testDate, (d) => holidays.has(d)) };
  }

  /**
   * Saves the press readings of one sheet in one transaction (7.3). Each row completes
   * its test; a completed test can be saved again to correct it (A-85). There is no
   * separate "start" step (A-90).
   */
  async saveResults(
    tenantId: string,
    userId: string,
    dto: SaveTestResultsDto,
  ): Promise<{ saved: number }> {
    const testDate = parseDate(dto.testDate);
    const today = await this.auth.tenantToday(tenantId);
    if (compareCalendarDates(testDate, today) > 0) {
      throw new BadRequestException(['testDate can not be in the future']);
    }
    const ids = dto.rows.map((r) => r.testId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(['A test appears more than once']);
    }
    const tests = await this.prisma.specimenTest.findMany({
      where: { tenantId, id: { in: ids } },
      select: {
        id: true,
        status: true,
        specimen: {
          select: {
            status: true,
            specimenNumber: true,
            sample: {
              select: { delivery: { select: { fieldRecord: { select: { pourDate: true } } } } },
            },
          },
        },
      },
    });
    if (tests.length !== ids.length) throw new NotFoundException('Test not found');
    for (const t of tests) {
      if (t.status === 'CANCELLED' || t.specimen.status === 'CANCELLED') {
        throw new ConflictException(`Specimen ${t.specimen.specimenNumber ?? ''} is cancelled`);
      }
      const pourDate = calendarDateFromDb(t.specimen.sample.delivery.fieldRecord.pourDate);
      if (compareCalendarDates(testDate, pourDate) < 0) {
        throw new BadRequestException([
          `Specimen ${t.specimen.specimenNumber ?? ''} can not be tested before its pour date`,
        ]);
      }
    }

    const pressCode = dto.pressCode?.trim() || null;
    const dimensionEquipment = dto.dimensionEquipment?.trim() || null;
    await this.prisma.$transaction(async (tx) => {
      for (const row of dto.rows) {
        const { count } = await tx.specimenTest.updateMany({
          where: {
            id: row.testId,
            tenantId,
            status: { in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] },
          },
          data: {
            status: 'COMPLETED',
            testDate: calendarDateToDb(testDate),
            testTime: row.testTime ? timeOfDayToDb(parseTimeOfDay(row.testTime)) : null,
            height1Cm: row.height1Cm,
            height2Cm: row.height2Cm,
            diameter1Cm: row.diameter1Cm,
            diameter2Cm: row.diameter2Cm,
            maxLoadKgf: row.maxLoadKgf,
            loadDurationS: row.loadDurationS ?? null,
            failureType: row.failureType ?? null,
            pressCode,
            dimensionEquipment,
            performedById: userId,
          },
        });
        if (count !== 1) {
          throw new ConflictException('The test changed meanwhile; reload the sheet');
        }
      }
    });
    return { saved: dto.rows.length };
  }

  /**
   * For the field-records module, inside its transaction: cancels the open tests of a
   * cancelled specimen. Returns false when the specimen was already tested.
   */
  async cancelOpenTestsOfSpecimen(
    tx: Prisma.TransactionClient,
    tenantId: string,
    specimenId: string,
  ): Promise<boolean> {
    const tested = await tx.specimenTest.count({
      where: { tenantId, specimenId, status: 'COMPLETED' },
    });
    if (tested > 0) return false;
    await tx.specimenTest.updateMany({
      where: { tenantId, specimenId, status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
      data: { status: 'CANCELLED' },
    });
    return true;
  }

  /**
   * For the field-records module: the tests of some specimens (cancelled ones too),
   * with the result when tested against the record's design strength.
   */
  async briefsForSpecimens(
    tenantId: string,
    specimenIds: readonly string[],
    designStrengthKgCm2: number | null = null,
  ): Promise<SpecimenTestBrief[]> {
    if (specimenIds.length === 0) return [];
    const rows = await this.prisma.specimenTest.findMany({
      where: { tenantId, specimenId: { in: [...specimenIds] } },
      select: BRIEF_SELECT,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => toBrief(r, designStrengthKgCm2));
  }
}

/** Sample types that go on the compression worksheet (A-87). */
const CYLINDERS: SpecimenType[] = ['CYLINDER_15X30', 'CYLINDER_10X20'];

const num = (d: { toNumber(): number } | null): number | null => (d === null ? null : d.toNumber());

function parseDate(value: string): CalendarDate {
  try {
    return parseCalendarDate(value);
  } catch (error) {
    if (error instanceof InvalidCalendarDateError) throw new BadRequestException([error.message]);
    throw error;
  }
}
