import { BadRequestException, Injectable } from '@nestjs/common';
import { HolidaysService } from '../catalogs/holidays.service.js';
import { ProjectsService, type ProjectView } from '../projects/projects.service.js';
import {
  addDays,
  CalendarDate,
  calendarDateFromDb,
  calendarDateToDb,
  InvalidCalendarDateError,
  parseCalendarDate,
} from '../shared/dates/calendar-date.js';
import { timeOfDayFromDb } from '../shared/dates/time-of-day.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';
import { buildBitacora, type Bitacora, type BitacoraRecordInput } from './bitacora.js';
import type { BitacoraQueryDto } from './dto/bitacora-query.dto.js';

/** A shift past Sundays and holidays never exceeds a few days. */
const HOLIDAY_MARGIN_DAYS = 14;
/** The longest test age the lab uses is well under this (Q-19). */
const MAX_AGE_DAYS = 400;

type Dec = { toNumber(): number } | null;
const num = (d: Dec): number | null => (d === null ? null : d.toNumber());

export type ProjectBitacora = Bitacora & { project: ProjectView };

/**
 * The Bitácora read model (ADR-004): no table. A documented composed read over field
 * records, deliveries, samples, specimens and tests (all owned by other modules); it
 * never writes. Only completed records are logged (A-93); cancelled specimens are left
 * out (A-92).
 */
@Injectable()
export class BitacoraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly holidays: HolidaysService,
  ) {}

  async forProject(
    tenantId: string,
    projectId: string,
    query: BitacoraQueryDto = {},
  ): Promise<ProjectBitacora> {
    const project = await this.projects.get(tenantId, projectId);
    const from = query.from ? parseDate(query.from) : null;
    const to = query.to ? parseDate(query.to) : null;

    const rows = await this.prisma.fieldRecord.findMany({
      where: {
        tenantId,
        projectId: project.id,
        status: 'COMPLETED',
        ...((from || to) && {
          pourDate: {
            ...(from && { gte: calendarDateToDb(from) }),
            ...(to && { lte: calendarDateToDb(to) }),
          },
        }),
      },
      include: {
        supplier: { select: { name: true } },
        deliveries: {
          include: {
            samples: {
              include: {
                specimens: {
                  where: { status: 'CREATED' },
                  include: {
                    tests: {
                      where: { status: { not: 'CANCELLED' } },
                      orderBy: { createdAt: 'desc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const inputs: BitacoraRecordInput[] = rows.map((r) => ({
      id: r.id,
      registrySequence: r.registrySequence,
      pourDate: calendarDateFromDb(r.pourDate),
      supplier: r.supplier?.name ?? null,
      production: r.production,
      specifiedStrengthKgCm2: num(r.specifiedStrengthKgCm2),
      specifiedSlumpCm: num(r.specifiedSlumpCm),
      specifiedSlumpToleranceCm: num(r.specifiedSlumpToleranceCm),
      maxAggregateSizeMm: num(r.maxAggregateSizeMm),
      castElement: r.castElement,
      unitWeightTareG: num(r.unitWeightTareG),
      unitWeightTareSampleG: num(r.unitWeightTareSampleG),
      unitWeightMoldFactor: num(r.unitWeightMoldFactor),
      airContentPct: num(r.airContentPct),
      samples: r.deliveries.flatMap((d) =>
        d.samples.map((s) => ({
          id: s.id,
          sampleNumber: s.sampleNumber,
          moldedAt: s.moldedAt ? timeOfDayFromDb(s.moldedAt) : null,
          slump1Cm: num(d.slump1Cm),
          slump2Cm: num(d.slump2Cm),
          concreteTemperatureC: num(d.concreteTemperatureC),
          specimens: s.specimens.map((sp) => {
            const t = sp.tests[0];
            return {
              id: sp.id,
              specimenNumber: sp.specimenNumber,
              test: t
                ? {
                    status: t.status as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED',
                    ageDays: t.ageDays,
                    keepExactDate: t.keepExactDate,
                    testDate: t.testDate ? calendarDateFromDb(t.testDate) : null,
                    height1Cm: num(t.height1Cm),
                    height2Cm: num(t.height2Cm),
                    diameter1Cm: num(t.diameter1Cm),
                    diameter2Cm: num(t.diameter2Cm),
                    maxLoadKgf: num(t.maxLoadKgf),
                  }
                : null,
            };
          }),
        })),
      ),
    }));

    const isHoliday = await this.holidayLookup(tenantId, inputs);
    return { project, ...buildBitacora(inputs, isHoliday) };
  }

  /** The Bitácoras of every project of the lab (the lab's workbook: a tab each, Q-68). */
  async allProjects(tenantId: string): Promise<ProjectBitacora[]> {
    const ids = await this.projects.listIds(tenantId);
    const out: ProjectBitacora[] = [];
    for (const id of ids) out.push(await this.forProject(tenantId, id));
    return out;
  }

  private async holidayLookup(
    tenantId: string,
    records: readonly BitacoraRecordInput[],
  ): Promise<(date: CalendarDate) => boolean> {
    if (records.length === 0) return () => false;
    const dates = records.map((r) => r.pourDate).sort();
    const holidays = await this.holidays.holidaySet(
      tenantId,
      dates[0],
      addDays(dates[dates.length - 1], MAX_AGE_DAYS + HOLIDAY_MARGIN_DAYS),
    );
    return (d) => holidays.has(d);
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
