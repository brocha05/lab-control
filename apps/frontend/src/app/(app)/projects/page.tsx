import type { Metadata } from 'next';
import { ProjectsPage } from '@/modules/projects/components/ProjectsPage';

export const metadata: Metadata = { title: 'Proyectos' };

export default function Page() {
  return <ProjectsPage />;
}
