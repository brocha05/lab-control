import type { Metadata } from 'next';
import { BitacoraPage } from '@/modules/bitacora/components/BitacoraPage';

export const metadata: Metadata = { title: 'Bitácora' };

// Phase 8 (FPC01-02), a derived view (ADR-004).
export default function Page() {
  return <BitacoraPage />;
}
