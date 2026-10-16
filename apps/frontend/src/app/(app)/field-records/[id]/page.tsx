import type { Metadata } from 'next';
import { FieldRecordEditor } from '@/modules/field-records/components/FieldRecordEditor';

export const metadata: Metadata = { title: 'Registro de campo' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FieldRecordEditor id={id} />;
}
