import type { Metadata } from 'next';
import { ClipboardList } from 'lucide-react';
import { UpcomingSection } from '@/components/shared/UpcomingSection';

export const metadata: Metadata = { title: 'Registros de campo' };

// Phase 4 (FPC01-01). Blocked items: docs/roadmap/development-plan.md.
export default function Page() {
  return (
    <UpcomingSection
      title="Registros de campo"
      description="Recepción de concreto hidráulico en obra (FPC01-01)"
      icon={ClipboardList}
      upcoming="Aquí se capturarán los colados: datos del concreto, condiciones, entregas (camiones) y los especímenes elaborados."
    />
  );
}
