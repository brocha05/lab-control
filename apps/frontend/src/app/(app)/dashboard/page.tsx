import type { Metadata } from 'next';
import { LayoutDashboard } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';

export const metadata: Metadata = { title: 'Inicio' };

// Summary counts (due today, overdue, drafts…) arrive with GET /dashboard/summary (Phase 8+).
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Inicio" description="Resumen del laboratorio" />
      <EmptyState
        icon={LayoutDashboard}
        title="Todavía no hay información"
        description="Aquí aparecerán las pruebas pendientes y el resumen de proyectos."
      />
    </div>
  );
}
