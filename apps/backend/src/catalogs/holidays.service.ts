import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CalendarDate,
  calendarDateFromDb,
  calendarDateToDb,
  InvalidCalendarDateError,
  parseCalendarDate,
} from '../shared/dates/calendar-date.js';
import { isUniqueViolation } from '../shared/prisma/prisma-errors.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';

export interface HolidayView {
  id: string;
  date: CalendarDate;
  name: string;
}

/**
 * Owns `holidays`: the lab's own list of non-working days (Q-81, A-78). A scheduled
 * test date on a Sunday or one of these moves to the next working day (Q-21).
 */
@Injectable()
export class HolidaysService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, year: number): Promise<HolidayView[]> {
    const rows = await this.prisma.holiday.findMany({
      where: {
        tenantId,
        date: {
          gte: calendarDateToDb(parseCalendarDate(`${year}-01-01`)),
          lte: calendarDateToDb(parseCalendarDate(`${year}-12-31`)),
        },
      },
      orderBy: { date: 'asc' },
    });
    return rows.map((h) => ({ id: h.id, date: calendarDateFromDb(h.date), name: h.name }));
  }

  async create(tenantId: string, date: string, name: string): Promise<HolidayView> {
    let day: CalendarDate;
    try {
      day = parseCalendarDate(date);
    } catch (error) {
      if (error instanceof InvalidCalendarDateError) throw new BadRequestException(error.message);
      throw error;
    }
    try {
      const h = await this.prisma.holiday.create({
        data: { tenantId, date: calendarDateToDb(day), name },
      });
      return { id: h.id, date: day, name: h.name };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`${day} is already a holiday`);
      }
      throw error;
    }
  }

  /** Holidays are configuration, not records: removing one is allowed. */
  async remove(tenantId: string, id: string): Promise<void> {
    const { count } = await this.prisma.holiday.deleteMany({ where: { id, tenantId } });
    if (count !== 1) throw new NotFoundException('Holiday not found');
  }

  /** For scheduling: the lab's holidays between two dates, as a lookup set. */
  async holidaySet(tenantId: string, from: CalendarDate, to: CalendarDate): Promise<Set<string>> {
    const rows = await this.prisma.holiday.findMany({
      where: { tenantId, date: { gte: calendarDateToDb(from), lte: calendarDateToDb(to) } },
      select: { date: true },
    });
    return new Set(rows.map((r) => calendarDateFromDb(r.date)));
  }
}
