import type { Metadata } from 'next';
import { ClientDetail } from '@/modules/clients/components/ClientDetail';

export const metadata: Metadata = { title: 'Cliente' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientDetail id={id} />;
}
