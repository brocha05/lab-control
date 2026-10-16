'use client';

import { NativeSelect } from '@/components/ui/native-select';
import { MAX_PAGE_SIZE } from '@/types';
import { useProjects } from '../hooks/useProjects';

interface ProjectSelectProps {
  id?: string;
  value: string;
  onChange: (projectId: string) => void;
  placeholder?: string;
}

/**
 * Picks one of the lab's projects, "CLIENT · PROJECT · name". Loads the first page
 * (10–15 projects a year, Q-50); switch to a searchable combobox if it grows.
 */
export function ProjectSelect({ id, value, onChange, placeholder }: ProjectSelectProps) {
  const { data, isLoading } = useProjects({ page: 1, limit: MAX_PAGE_SIZE });
  const projects = data?.items ?? [];

  return (
    <NativeSelect
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isLoading}
      aria-label={placeholder ?? 'Proyecto'}
    >
      <option value="">
        {isLoading ? 'Cargando proyectos…' : (placeholder ?? 'Selecciona un proyecto')}
      </option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {[p.code, p.name].filter(Boolean).join(' · ')} — {p.client.name}
        </option>
      ))}
    </NativeSelect>
  );
}
