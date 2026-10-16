'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateFieldRecord, useNextNumbers } from '../hooks/useFieldRecords';

interface NewFieldRecordFormProps {
  projectId: string;
  /** Closes the form (also after the draft is created). */
  onClose: () => void;
}

/** Starts a DRAFT with the pour date and the registro number (next one by default, Q-55). */
export function NewFieldRecordForm({ projectId, onClose }: NewFieldRecordFormProps) {
  const router = useRouter();
  const next = useNextNumbers(projectId);
  const create = useCreateFieldRecord(projectId);
  const [pourDate, setPourDate] = useState('');
  const [registry, setRegistry] = useState('');
  const [front, setFront] = useState('1');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pourDate) return;
    create.mutate(
      {
        pourDate,
        registrySequence: registry ? Number(registry) : undefined,
        frontNumber: Number(front) || 1,
      },
      {
        onSuccess: (record) => {
          onClose();
          router.push(`/field-records/${record.id}`);
        },
      }
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormField id="pourDate" label="Fecha del colado" required>
        <Input
          id="pourDate"
          type="date"
          value={pourDate}
          onChange={(e) => setPourDate(e.target.value)}
          autoFocus
        />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="registry"
          label="Número de registro (MCH)"
          hint={
            next.data
              ? `Vacío = siguiente: ${String(next.data.registrySequence).padStart(3, '0')}`
              : undefined
          }
        >
          <Input
            id="registry"
            type="number"
            min={1}
            value={registry}
            onChange={(e) => setRegistry(e.target.value)}
            placeholder={next.data ? String(next.data.registrySequence) : ''}
          />
        </FormField>
        <FormField id="front" label="Frente">
          <Input
            id="front"
            type="number"
            min={1}
            value={front}
            onChange={(e) => setFront(e.target.value)}
          />
        </FormField>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={create.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={create.isPending || !pourDate}>
          {create.isPending && <Loader2 className="animate-spin" />}
          Crear registro
        </Button>
      </div>
    </form>
  );
}
