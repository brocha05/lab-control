/**
 * Clock times written on the lab forms (`HH:MM`, 24 h), stored as Postgres `TIME`.
 * A time only makes sense together with the date of its row (docs/database/schema.md).
 */
export type TimeOfDay = string & { readonly __brand: 'TimeOfDay' };

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class InvalidTimeOfDayError extends Error {
  constructor(value: string) {
    super(`Invalid time of day "${value}" (expected HH:MM, 00:00–23:59)`);
    this.name = 'InvalidTimeOfDayError';
  }
}

export function parseTimeOfDay(value: string): TimeOfDay {
  if (!HH_MM.test(value)) throw new InvalidTimeOfDayError(value);
  return value as TimeOfDay;
}

/** Minutes since midnight. */
export function minutesOfDay(time: TimeOfDay): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Prisma returns `@db.Time` columns as a JS Date on 1970-01-01 UTC. */
export function timeOfDayFromDb(value: Date): TimeOfDay {
  return value.toISOString().slice(11, 16) as TimeOfDay;
}

export function timeOfDayToDb(time: TimeOfDay): Date {
  return new Date(`1970-01-01T${time}:00.000Z`);
}
