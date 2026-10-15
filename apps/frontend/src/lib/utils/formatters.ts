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
