import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProjectDetail } from '@/modules/projects/components/ProjectDetail';

export const metadata: Metadata = { title: 'Proyecto' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ProjectDetail reads ?tab= (useSearchParams needs a Suspense boundary).
  return (
    <Suspense>
      <ProjectDetail id={id} />
    </Suspense>
  );
}
