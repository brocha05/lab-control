'use client';

import { Building2, CalendarClock, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/shared/StatCard';
import { useClients } from '@/modules/clients/hooks/useClients';
import { useProjects } from '@/modules/projects/hooks/useProjects';

/**
 * Counts from the list endpoints' totals. The real summary (due today, overdue, drafts…)
 * arrives with GET /dashboard/summary (development-plan 8.4).
 */
export function DashboardSummary() {
  const clients = useClients({ page: 1, limit: 1 });
  const projects = useProjects({ page: 1, limit: 1 });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Link href="/clients" className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring">
        <StatCard
          title="Clientes"
          value={clients.data?.total ?? 0}
          icon={Building2}
          isLoading={clients.isLoading}
          className="transition-colors hover:bg-muted/40"
        />
      </Link>
      <Link href="/projects" className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring">
        <StatCard
          title="Proyectos"
          value={projects.data?.total ?? 0}
          icon={FolderKanban}
          isLoading={projects.isLoading}
          className="transition-colors hover:bg-muted/40"
        />
      </Link>
      <StatCard
        title="Pruebas pendientes"
        value="—"
        description="Disponible con los registros de campo"
        icon={CalendarClock}
      />
    </div>
  );
}
