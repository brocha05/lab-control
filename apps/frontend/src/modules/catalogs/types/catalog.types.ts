/** `CatalogEntryView` in apps/backend/src/catalogs/catalogs.service.ts. */
export interface CatalogEntry {
  id: string;
  name: string;
}

export type CatalogKind = 'suppliers' | 'cement-types';

/** `HolidayView` in apps/backend/src/catalogs/holidays.service.ts. */
export interface Holiday {
  id: string;
  /** `YYYY-MM-DD` (format with `formatCalendarDate`). */
  date: string;
  name: string;
}
