import { z } from 'zod';
import type { ClientInput } from '../types/client.types';

// Limits mirror apps/backend/src/clients/dto/client.dto.ts.
export const clientSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(200, 'Máximo 200 caracteres'),
  contactName: z.string().trim().max(200, 'Máximo 200 caracteres'),
  contactPhone: z.string().trim().max(50, 'Máximo 50 caracteres'),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export function toClientInput(values: ClientFormValues): ClientInput {
  return {
    name: values.name,
    contactName: values.contactName || null,
    contactPhone: values.contactPhone || null,
  };
}
