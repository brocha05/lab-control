import type { Metadata } from 'next';
import { CalendarClock } from 'lucide-react';
import { UpcomingSection } from '@/components/shared/UpcomingSection';

export const metadata: Metadata = { title: 'Pruebas pendientes' };

// Phase 6 (GET /tests/pending).
export default function Page() {
  return (
    <UpcomingSection
      title="Pruebas pendientes"
      description="Especímenes por ensayar según su edad"
      icon={CalendarClock}
      upcoming="Aquí aparecerán los cilindros que toca ensayar hoy, los atrasados y los próximos, calculados desde la fecha del colado."
    />
  );
}
