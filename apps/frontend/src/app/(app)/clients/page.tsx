import type { Metadata } from 'next';
import { ClientsPage } from '@/modules/clients/components/ClientsPage';

export const metadata: Metadata = { title: 'Clientes' };

export default function Page() {
  return <ClientsPage />;
}
