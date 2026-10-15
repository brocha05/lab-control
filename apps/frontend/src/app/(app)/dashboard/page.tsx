import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/PageHeader';
import { DashboardSummary } from '@/modules/dashboard/components/DashboardSummary';

export const metadata: Metadata = { title: 'Inicio' };

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Inicio" description="Resumen del laboratorio" />
      <DashboardSummary />
    </div>
  );
}
