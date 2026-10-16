'use client';

import { Menu, Plus } from 'lucide-react';
import Link from 'next/link';
import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/modules/projects/hooks/useProjects';
import { useUiStore } from '@/store/uiStore';
import { MAX_PAGE_SIZE } from '@/types';

function Breadcrumbs() {
  const crumbs = useUiStore((s) => s.crumbs);
  return (
    <nav aria-label="Ruta" className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        // On phones only the last two levels fit.
        const hideOnMobile = i < crumbs.length - 2;
        return (
          <Fragment key={`${i}-${c.label}`}>
            {i > 0 && (
              <span
                className={`text-[13px] text-[#B5B8BC] ${i < crumbs.length - 1 ? 'hidden md:inline' : ''}`}
              >
                /
              </span>
            )}
            {c.href && !last ? (
              <Link
                href={c.href}
                className={`truncate text-[13px] text-[#6A6E73] hover:text-foreground ${hideOnMobile ? 'hidden md:inline' : ''}`}
              >
                {c.label}
              </Link>
            ) : (
              <span
                className={`truncate text-[13px] ${last ? 'font-medium text-foreground' : 'text-[#6A6E73]'} ${hideOnMobile ? 'hidden md:inline' : ''}`}
                aria-current={last ? 'page' : undefined}
              >
                {c.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

/** Project picked for the whole session: the default of "Nuevo registro". */
function ProjectPicker() {
  const currentProjectId = useUiStore((s) => s.currentProjectId);
  const setCurrentProjectId = useUiStore((s) => s.setCurrentProjectId);
  const { data } = useProjects({ page: 1, limit: MAX_PAGE_SIZE });
  const projects = data?.items ?? [];
  const value = projects.some((p) => p.id === currentProjectId) ? currentProjectId : '';

  return (
    <label className="hidden h-9 items-center gap-2 rounded-md border bg-surface pl-3 pr-1 md:flex">
      <span className="text-xs text-[#6A6E73]">Proyecto</span>
      <select
        value={value}
        onChange={(e) => setCurrentProjectId(e.target.value)}
        className="h-8 max-w-[220px] cursor-pointer border-0 bg-transparent text-[13px] font-medium text-foreground focus-visible:outline-none"
      >
        <option value="">Selecciona…</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Topbar() {
  const setDrawerOpen = useUiStore((s) => s.setDrawerOpen);
  const setNewRecordOpen = useUiStore((s) => s.setNewRecordOpen);

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-3 border-b bg-card px-[clamp(14px,3vw,32px)] print:hidden">
      <Button
        variant="outline"
        size="icon"
        className="md:hidden"
        onClick={() => setDrawerOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu />
      </Button>
      <Breadcrumbs />
      <ProjectPicker />
      <Button onClick={() => setNewRecordOpen(true)} aria-label="Nuevo registro">
        <Plus strokeWidth={2} />
        <span className="hidden md:inline">Nuevo registro</span>
      </Button>
    </header>
  );
}
