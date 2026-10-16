import {
  InvalidTimeOfDayError,
  minutesOfDay,
  parseTimeOfDay,
  timeOfDayFromDb,
  timeOfDayToDb,
} from './time-of-day.js';

describe('TimeOfDay', () => {
  it.each(['00:00', '10:30', '23:59'])('accepts %s', (v) => {
    expect(parseTimeOfDay(v)).toBe(v);
  });

  it.each(['24:00', '9:30', '10:60', '10:30:00', ''])('rejects %p', (v) => {
    expect(() => parseTimeOfDay(v)).toThrow(InvalidTimeOfDayError);
  });

  it('converts to minutes of the day', () => {
    expect(minutesOfDay(parseTimeOfDay('10:30'))).toBe(630);
  });

  it('round-trips through the Prisma TIME representation', () => {
    const t = parseTimeOfDay('08:36');
    expect(timeOfDayToDb(t).toISOString()).toBe('1970-01-01T08:36:00.000Z');
    expect(timeOfDayFromDb(timeOfDayToDb(t))).toBe('08:36');
  });
});
