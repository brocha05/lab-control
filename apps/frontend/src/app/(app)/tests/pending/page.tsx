import type { Metadata } from 'next';
import { PendingTestsPage } from '@/modules/specimen-tests/components/PendingTestsPage';

export const metadata: Metadata = { title: 'Ensayos pendientes' };

export default function Page() {
  return <PendingTestsPage />;
}
