import type { PaginationParams } from '@/types';

/** `ProjectView` in apps/backend/src/projects/projects.service.ts. */
export interface Project {
  id: string;
  /** Official name as printed on the report (Q-78). */
  name: string;
  location: string | null;
  client: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

/** Body of POST /projects and PATCH /projects/:id. `null` clears `location`. */
export interface ProjectInput {
  clientId: string;
  name: string;
  location: string | null;
}

export interface ProjectListParams extends PaginationParams {
  q?: string;
  clientId?: string;
}
