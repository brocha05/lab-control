'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRescheduleTest } from '../hooks/useSpecimenTests';

interface RescheduleFormProps {
  testId: string;
  ageDays: number;
  keepExactDate: boolean;
  onDone: () => void;
}

/**
 * Change one test's age at the client's request, until it is tested (Q-22), or keep
 * its exact date even on a Sunday or holiday (Q-21).
 */
export function RescheduleForm({ testId, ageDays, keepExactDate, onDone }: RescheduleFormProps) {
  const reschedule = useRescheduleTest();
  const [age, setAge] = useState(String(ageDays));
  const [exact, setExact] = useState(keepExactDate);
  const valid = Number.isInteger(Number(age)) && Number(age) >= 1;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        reschedule.mutate(
          { id: testId, ageDays: Number(age), keepExactDate: exact },
          { onSuccess: onDone }
        );
      }}
    >
      <FormField id="ageDays" label="Edad de ensayo (días)">
        <Input
          id="ageDays"
          type="number"
          min={1}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-32"
          autoFocus
        />
      </FormField>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={exact}
          onChange={(e) => setExact(e.target.checked)}
        />
        <span>
          Ensayar en la edad exacta aunque caiga en domingo o día festivo
          <span className="block text-xs text-muted-foreground">
            Solo si el cliente lo requiere. Si no, se recorre al siguiente día hábil.
          </span>
        </span>
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={reschedule.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!valid || reschedule.isPending}>
          {reschedule.isPending && <Loader2 className="animate-spin" />}
          Guardar
        </Button>
      </div>
    </form>
  );
}
