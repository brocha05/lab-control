import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProjectsPage } from '@/modules/projects/components/ProjectsPage';

export const metadata: Metadata = { title: 'Proyectos' };

export default function Page() {
  // ProjectsPage reads ?clientId= (useSearchParams needs a Suspense boundary).
  return (
    <Suspense>
      <ProjectsPage />
    </Suspense>
  );
}
