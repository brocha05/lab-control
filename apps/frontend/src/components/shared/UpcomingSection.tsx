import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';

interface UpcomingSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  /** What the section will show, in the lab's words. */
  upcoming: string;
}

/** Placeholder for sections whose phase is still blocked (PROJECT_STATUS.md). */
export function UpcomingSection({ title, description, icon, upcoming }: UpcomingSectionProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Card>
        <EmptyState icon={icon} title="Disponible próximamente" description={upcoming} />
      </Card>
    </div>
  );
}
