import type { Metadata } from 'next';
import { Suspense } from 'react';
import { WorksheetPage } from '@/modules/specimen-tests/components/WorksheetPage';

export const metadata: Metadata = { title: 'Hoja de ensayos' };

export default function Page() {
  // WorksheetPage reads ?projectId=&date= (useSearchParams needs a Suspense boundary).
  return (
    <Suspense>
      <WorksheetPage />
    </Suspense>
  );
}
