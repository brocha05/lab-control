import type { LucideIcon } from 'lucide-react';
import { SetBreadcrumbs } from '@/components/layout/SetBreadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

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
    <div className="flex flex-col gap-5">
      <SetBreadcrumbs crumbs={[{ label: title }]} />
      <PageHeader title={title} description={description} />
      <div className="rounded-lg border bg-card">
        <EmptyState icon={icon} title="Disponible próximamente" description={upcoming} />
      </div>
    </div>
  );
}
