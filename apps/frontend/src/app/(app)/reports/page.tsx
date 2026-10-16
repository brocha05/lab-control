import type { Metadata } from 'next';
import { ReportsPage } from '@/modules/reports/components/ReportsList';

export const metadata: Metadata = { title: 'Informes' };

// Phase 9 (FPC06-04).
export default function Page() {
  return <ReportsPage />;
}
