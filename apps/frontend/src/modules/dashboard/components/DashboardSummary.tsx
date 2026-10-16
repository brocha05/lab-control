'use client';

import { Building2, CalendarClock, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/shared/StatCard';
import { useClients } from '@/modules/clients/hooks/useClients';
import { useProjects } from '@/modules/projects/hooks/useProjects';
import { usePendingTests } from '@/modules/specimen-tests/hooks/useSpecimenTests';

/** `YYYY-MM-DD` of today in the browser's calendar. */
function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Counts from the list endpoints. A dedicated GET /dashboard/summary can replace them
 * later (development-plan 8.4).
 */
export function DashboardSummary() {
  const clients = useClients({ page: 1, limit: 1 });
  const projects = useProjects({ page: 1, limit: 1 });
  const dueNow = usePendingTests({ until: today() });
  const overdue = dueNow.data?.filter((t) => t.dueStatus === 'OVERDUE').length ?? 0;
  const dueToday = dueNow.data?.filter((t) => t.dueStatus === 'DUE_TODAY').length ?? 0;

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
      <Link
        href="/tests/pending"
        className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
      >
        <StatCard
          title="Ensayes para hoy"
          value={dueToday}
          description={overdue > 0 ? `${overdue} atrasados` : 'Ninguno atrasado'}
          icon={CalendarClock}
          isLoading={dueNow.isLoading}
          className="transition-colors hover:bg-muted/40"
        />
      </Link>
    </div>
  );
}
