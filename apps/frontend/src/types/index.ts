// ─── API envelope (mirrors apps/backend/src/shared/http/api-response.ts) ─────

export interface ResponseMeta {
  requestId: string;
}

export interface SuccessApiResponse<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ErrorApiResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
  meta: ResponseMeta;
}

/** Paginated list after the client unwraps the envelope. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Backend maximum for `limit` (apps/backend/src/shared/http/pagination.ts). */
export const MAX_PAGE_SIZE = 100;

export type PaginationParams = {
  page?: number;
  limit?: number;
};

// ─── Identity & tenancy (docs/database/schema.md) ────────────────────────────

/** The lab's roles (Q-39), mirroring the backend `UserRole` enum. */
export type UserRole = 'QUALITY_MANAGER' | 'QMS_COORDINATOR' | 'LAB_MANAGER' | 'FIELD_CREW_CHIEF';

/** Position names as the lab writes them (UI is Spanish, A-40). */
export const ROLE_LABELS: Record<UserRole, string> = {
  QUALITY_MANAGER: 'Jefe de Control de Calidad',
  QMS_COORDINATOR: 'Coordinador del SGC',
  LAB_MANAGER: 'Jefe de Laboratorio',
  FIELD_CREW_CHIEF: 'Jefe de Brigada de Campo',
};

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  /** IANA timezone used for "today" (ASSUMPTION A-14). */
  timezone: string;
}

/** `GET /me`: current user + tenant (apps/backend/src/auth/auth.service.ts `MeView`). */
/** What a role may change (apps/backend/src/auth/domain/permissions.ts). */
export type Permission =
  | 'catalogs.manage'
  | 'records.capture'
  | 'reports.prepare'
  | 'reports.issue'
  | 'users.manage'
  | 'audit.read';

export interface Me {
  user: User;
  tenant: Tenant;
  permissions: Permission[];
}
