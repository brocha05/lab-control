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

export type PaginationParams = {
  page?: number;
  limit?: number;
};

// ─── Identity & tenancy (docs/database/schema.md) ────────────────────────────

/** Placeholder roles. ASSUMPTION A-33, real roles are Q-39/Q-40. */
export type UserRole = 'ADMIN' | 'MEMBER';

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
export interface Me {
  user: User;
  tenant: Tenant;
}
