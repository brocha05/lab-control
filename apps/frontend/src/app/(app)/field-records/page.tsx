import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FieldRecordsPage } from '@/modules/field-records/components/FieldRecordsPage';

export const metadata: Metadata = { title: 'Registros de campo' };

export default function Page() {
  // FieldRecordsPage reads ?projectId= (useSearchParams needs a Suspense boundary).
  return (
    <Suspense>
      <FieldRecordsPage />
    </Suspense>
  );
}
