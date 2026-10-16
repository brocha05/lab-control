'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MAX_PAGE_SIZE } from '@/types';
import { useClients } from '../hooks/useClients';

interface ClientSelectProps {
  id?: string;
  value: string | undefined;
  onChange: (clientId: string) => void;
  /** Adds an "all clients" option (for list filters). */
  allLabel?: string;
  invalid?: boolean;
  disabled?: boolean;
}

const ALL = '__all__';

/**
 * Picks one of the tenant's clients. Loads the first page sorted by name, which covers a
 * single laboratory's client list (A-50); switch to a searchable combobox if it grows.
 */
export function ClientSelect({
  id,
  value,
  onChange,
  allLabel,
  invalid,
  disabled,
}: ClientSelectProps) {
  const { data, isLoading } = useClients({ page: 1, limit: MAX_PAGE_SIZE });
  const clients = data?.items ?? [];

  return (
    <Select
      value={value || (allLabel ? ALL : undefined)}
      onValueChange={(v) => onChange(v === ALL ? '' : v)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger id={id} className={invalid ? 'border-destructive' : undefined}>
        <SelectValue placeholder={isLoading ? 'Cargando clientes…' : 'Selecciona un cliente'} />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value={ALL}>{allLabel}</SelectItem>}
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.code ? `${c.code} · ${c.name}` : c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
