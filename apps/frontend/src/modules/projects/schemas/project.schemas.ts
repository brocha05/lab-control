import { z } from 'zod';
import { recordCodeSchema } from '@/lib/utils/recordCode';
import type { ProjectInput } from '../types/project.types';

// Limits mirror apps/backend/src/projects/dto/project.dto.ts.
export const projectSchema = z.object({
  clientId: z.string().min(1, 'Selecciona un cliente'),
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(300, 'Máximo 300 caracteres'),
  code: recordCodeSchema,
  location: z.string().trim().max(300, 'Máximo 300 caracteres'),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

export function toProjectInput(values: ProjectFormValues): ProjectInput {
  return {
    clientId: values.clientId,
    name: values.name,
    code: values.code,
    location: values.location || null,
  };
}
