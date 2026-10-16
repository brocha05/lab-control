'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { ClientSelect } from '@/modules/clients/components/ClientSelect';
import { projectSchema, toProjectInput, type ProjectFormValues } from '../schemas/project.schemas';
import type { Project, ProjectInput } from '../types/project.types';

interface ProjectFormProps {
  project?: Project;
  /** Pre-selected client when creating from a client's page. */
  defaultClientId?: string;
  submitLabel: string;
  isPending: boolean;
  onSubmit: (data: ProjectInput) => void;
  onCancel?: () => void;
}

export function ProjectForm({
  project,
  defaultClientId,
  submitLabel,
  isPending,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: project?.client.id ?? defaultClientId ?? '',
      name: project?.name ?? '',
      code: project?.code ?? '',
      location: project?.location ?? '',
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(toProjectInput(values)))}
      className="space-y-4"
      noValidate
    >
      <FormField id="clientId" label="Cliente" error={errors.clientId?.message} required>
        <Controller
          control={control}
          name="clientId"
          render={({ field }) => (
            <ClientSelect
              id="clientId"
              value={field.value}
              onChange={field.onChange}
              invalid={!!errors.clientId}
            />
          )}
        />
      </FormField>

      <FormField
        id="name"
        label="Nombre de la obra"
        hint="Nombre oficial, como se imprime en el informe."
        error={errors.name?.message}
        required
      >
        <Input
          id="name"
          placeholder='CONSTRUCCIÓN DE PUENTE VEHICULAR "LAS TUNAS"'
          className={cn(errors.name && 'border-destructive')}
          {...register('name')}
        />
      </FormField>

      <FormField
        id="code"
        label="Clave"
        hint="3 o 4 letras para el número de informe, p. ej. PVLT."
        error={errors.code?.message}
        required
      >
        <Input
          id="code"
          maxLength={4}
          className={cn('w-32 uppercase', errors.code && 'border-destructive')}
          {...register('code')}
        />
      </FormField>

      <FormField id="location" label="Ubicación" error={errors.location?.message}>
        <Input
          id="location"
          placeholder="Las Tunas, Tepames, Colima"
          className={cn(errors.location && 'border-destructive')}
          {...register('location')}
        />
      </FormField>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isPending || (!!project && !isDirty)}>
          {isPending && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
