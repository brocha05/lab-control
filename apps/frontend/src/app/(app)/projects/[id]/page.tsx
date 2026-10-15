import type { Metadata } from 'next';
import { ProjectDetail } from '@/modules/projects/components/ProjectDetail';

export const metadata: Metadata = { title: 'Proyecto' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
