import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { UpcomingSection } from '@/components/shared/UpcomingSection';

export const metadata: Metadata = { title: 'Informes' };

// Phase 9 (FPC06-04).
export default function Page() {
  return (
    <UpcomingSection
      title="Informes"
      description="Informes de pruebas de control de concreto hidráulico (FPC06-04)"
      icon={FileText}
      upcoming="Cuando todos los ensayes de una muestra estén completos se generará su informe en PDF."
    />
  );
}
