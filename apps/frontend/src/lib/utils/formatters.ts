// UI locale: Spanish (ASSUMPTION A-40, Q-47).
const LOCALE = 'es-MX';

// ─── Instant formatters (timestamps) ─────────────────────────────────────────
// Domain calendar dates (`YYYY-MM-DD`) must NOT go through `new Date()`, which shifts
// them by the browser timezone. Use `formatCalendarDate` for those.

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const diffSec = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHr / 24);

  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });

  if (diffSec < 60) return rtf.format(-diffSec, 'second');
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  if (diffHr < 24) return rtf.format(-diffHr, 'hour');
  if (diffDays < 30) return rtf.format(-diffDays, 'day');
  return formatDateTime(date);
}

// ─── Calendar dates (date-only domain values) ────────────────────────────────

export function formatCalendarDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, day))
  );
}

// ─── String formatters ────────────────────────────────────────────────────────

export function formatInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function parts(value: string): [number, number, number] {
  const [y, m, d] = value.split('-').map(Number);
  return [y, m, d];
}

/** `2026-10-03` → `03 Oct 2026`. */
export function formatDateLong(value: string | null | undefined): string {
  if (!value) return '—';
  const [y, m, d] = parts(value);
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
}

/** `2026-10-03` → `03 Oct`. */
export function formatDateShort(value: string | null | undefined): string {
  if (!value) return '—';
  const [, m, d] = parts(value);
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]}`;
}

/** `2026-10-03` → `03/10/2026`. */
export function formatDateNumeric(value: string | null | undefined): string {
  if (!value) return '—';
  const [y, m, d] = parts(value);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

/** `2026-10-03` → `Sábado 03 Oct 2026`. */
export function formatDateWithWeekday(value: string): string {
  const [y, m, d] = parts(value);
  return `${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${formatDateLong(value)}`;
}

/** Today as `YYYY-MM-DD` in the lab's timezone (A-14); the browser's if unknown. */
export function todayCalendarDate(timeZone?: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Adds days to a `YYYY-MM-DD` date (UTC arithmetic). */
export function addDays(value: string, days: number): string {
  const [y, m, d] = parts(value);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
