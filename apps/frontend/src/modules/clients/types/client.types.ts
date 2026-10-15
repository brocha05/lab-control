import type { PaginationParams } from '@/types';

/** `ClientView` in apps/backend/src/clients/clients.service.ts. */
export interface Client {
  id: string;
  name: string;
  contactName: string | null;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Body of POST /clients and PATCH /clients/:id. `null` clears an optional field. */
export interface ClientInput {
  name: string;
  contactName: string | null;
  contactPhone: string | null;
}

export interface ClientListParams extends PaginationParams {
  q?: string;
}
