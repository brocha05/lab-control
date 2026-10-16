'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { clientSchema, toClientInput, type ClientFormValues } from '../schemas/client.schemas';
import type { Client, ClientInput } from '../types/client.types';

interface ClientFormProps {
  client?: Client;
  submitLabel: string;
  isPending: boolean;
  onSubmit: (data: ClientInput) => void;
  onCancel?: () => void;
}

export function ClientForm({
  client,
  submitLabel,
  isPending,
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name ?? '',
      code: client?.code ?? '',
      contactName: client?.contactName ?? '',
      contactPhone: client?.contactPhone ?? '',
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(toClientInput(values)))}
      className="space-y-4"
      noValidate
    >
      <FormField
        id="name"
        label="Nombre o razón social"
        hint="Como aparece en el informe, p. ej. MARECOMSA S.A. DE C.V."
        error={errors.name?.message}
        required
      >
        <Input
          id="name"
          className={cn(errors.name && 'border-destructive')}
          autoFocus={!client}
          {...register('name')}
        />
      </FormField>

      <FormField
        id="code"
        label="Clave"
        hint="3 o 4 letras para el número de informe, p. ej. MAR."
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

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="contactName" label="Contacto" error={errors.contactName?.message}>
          <Input
            id="contactName"
            placeholder="Ing. Nombre Apellido"
            className={cn(errors.contactName && 'border-destructive')}
            {...register('contactName')}
          />
        </FormField>
        <FormField id="contactPhone" label="Teléfono" error={errors.contactPhone?.message}>
          <Input
            id="contactPhone"
            type="tel"
            className={cn(errors.contactPhone && 'border-destructive')}
            {...register('contactPhone')}
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isPending || (!!client && !isDirty)}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
