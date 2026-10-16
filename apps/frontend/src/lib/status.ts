import type { BadgeTone } from '@/components/ui/badge';

// One place for how each domain status reads and looks (UI is Spanish, A-40).

export interface StatusLook {
  label: string;
  tone: BadgeTone;
}

export const FIELD_RECORD_STATUS: Record<'DRAFT' | 'COMPLETED' | 'CANCELLED', StatusLook> = {
  DRAFT: { label: 'Borrador', tone: 'draft' },
  COMPLETED: { label: 'Completado', tone: 'done' },
  CANCELLED: { label: 'Cancelado', tone: 'off' },
};

/** When an open test is due (pending-tests.ts `DueStatus`). */
export const DUE_STATUS: Record<'OVERDUE' | 'DUE_TODAY' | 'UPCOMING', StatusLook> = {
  OVERDUE: { label: 'Atrasado', tone: 'late' },
  DUE_TODAY: { label: 'Hoy', tone: 'today' },
  UPCOMING: { label: 'Pendiente', tone: 'pending' },
};

export const TEST_STATUS: Record<
  'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
  StatusLook
> = {
  SCHEDULED: { label: 'Programado', tone: 'pending' },
  IN_PROGRESS: { label: 'En proceso', tone: 'progress' },
  COMPLETED: { label: 'Ensayado', tone: 'done' },
  CANCELLED: { label: 'Cancelado', tone: 'off' },
};

/** Report versions (ADR-005); a superseded FINAL reads "Sustituido". */
export const REPORT_STATUS: Record<'DRAFT' | 'GENERATED' | 'FINAL' | 'SUPERSEDED', StatusLook> = {
  DRAFT: { label: 'Borrador', tone: 'draft' },
  GENERATED: { label: 'PDF generado', tone: 'progress' },
  FINAL: { label: 'Emitido', tone: 'done' },
  SUPERSEDED: { label: 'Sustituido', tone: 'off' },
};
