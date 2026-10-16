import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { HolidaysService } from '../catalogs/holidays.service.js';
import type { Prisma, SpecimenTestStatus } from '../generated/prisma/client.js';
import {
  addDays,
  CalendarDate,
  calendarDateFromDb,
  compareCalendarDates,
  InvalidCalendarDateError,
  parseCalendarDate,
} from '../shared/dates/calendar-date.js';
import { timeOfDayFromDb } from '../shared/dates/time-of-day.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';
import { assignSpecimensToAges, type TestAgeRule } from './domain/test-schedule.js';
import type { PendingTestsQueryDto } from './dto/pending-tests.dto.js';
import type { RescheduleTestDto } from './dto/reschedule-test.dto.js';
import { buildPendingList, type PendingCandidate, type PendingTest } from './pending-tests.js';

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
    return this.prisma.specimenTest.findFirstOrThrow({
      where: { id, tenantId },
      select: { id: true, specimenId: true, ageDays: true, keepExactDate: true, status: true },
    });
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

  /** For the field-records module: the tests of some specimens (cancelled ones too). */
  async briefsForSpecimens(
    tenantId: string,
    specimenIds: readonly string[],
  ): Promise<SpecimenTestBrief[]> {
    if (specimenIds.length === 0) return [];
    return this.prisma.specimenTest.findMany({
      where: { tenantId, specimenId: { in: [...specimenIds] } },
      select: { id: true, specimenId: true, ageDays: true, keepExactDate: true, status: true },
      orderBy: { createdAt: 'asc' },
    });
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
