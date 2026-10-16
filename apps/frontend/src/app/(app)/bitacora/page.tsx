import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import { UpcomingSection } from '@/components/shared/UpcomingSection';

export const metadata: Metadata = { title: 'Bitácora' };

// Phase 8 (FPC01-02), a derived view (ADR-004).
export default function Page() {
  return (
    <UpcomingSection
      title="Bitácora"
      description="Bitácora electrónica de ensayos de concreto hidráulico (FPC01-02)"
      icon={BookOpen}
      upcoming="Se llenará sola con los registros de campo y los resultados de los ensayos: un renglón por espécimen."
    />
  );
}
