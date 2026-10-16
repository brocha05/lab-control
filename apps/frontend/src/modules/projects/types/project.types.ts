import type { PaginationParams } from '@/types';

/** `ProjectView` in apps/backend/src/projects/projects.service.ts. */
export interface Project {
  id: string;
  /** Official name as printed on the report (Q-78). */
  name: string;
  /** 3–4 letters for the report number (Q-56). null only for older projects. */
  code: string | null;
  location: string | null;
  client: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

/** Body of POST /projects and PATCH /projects/:id. `null` clears `location`. */
export interface ProjectInput {
  clientId: string;
  name: string;
  code: string;
  location: string | null;
}

/** One default test age of a project (Q-20). */
export interface TestAge {
  ageDays: number;
  specimenCount: number;
}

export interface ProjectListParams extends PaginationParams {
  q?: string;
  clientId?: string;
}
