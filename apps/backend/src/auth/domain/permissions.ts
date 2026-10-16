import type { UserRole } from '../../generated/prisma/client.js';

/**
 * What each lab position may change (docs/domain/entities.md#roles; Q-39, Q-40, Q-34).
 * Every role can read everything in its own lab. One place to adjust when the lab
 * answers the open questions (Q-93, Q-95, Q-103).
 */
export const PERMISSIONS = [
  /** Clients, projects, test ages, suppliers, cement types, holidays. */
  'catalogs.manage',
  /** Field records, specimens, test scheduling and results (Q-40: the Coordinador del SGC). */
  'records.capture',
  /** Create, edit and render reports. */
  'reports.prepare',
  /** Issue (finalize) reports: only the Jefe de Control de Calidad (Q-40). */
  'reports.issue',
  /** Accounts and roles (A-81, Q-83). */
  'users.manage',
  /** Read the audit trail (Q-54). */
  'audit.read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const MATRIX: Record<UserRole, readonly Permission[]> = {
  QUALITY_MANAGER: PERMISSIONS,
  // ASSUMPTION A-100: the Coordinador del SGC also manages catalogs and prepares reports.
  QMS_COORDINATOR: ['catalogs.manage', 'records.capture', 'reports.prepare', 'audit.read'],
  // ASSUMPTION A-101: the Jefe de Laboratorio and the Jefe de Brigada work on paper and
  // only consult the system (Q-40, Q-93).
  LAB_MANAGER: [],
  FIELD_CREW_CHIEF: [],
};

export function permissionsOf(role: UserRole): Permission[] {
  return [...MATRIX[role]];
}

export function can(role: UserRole, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}
