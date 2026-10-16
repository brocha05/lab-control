import { Badge } from '@/components/ui/badge';
import { REPORT_STATUS } from '@/lib/status';
import type { Report } from '../types/report.types';

export function ReportStatusBadge({ report }: { report: Pick<Report, 'status' | 'supersededAt'> }) {
  const look = REPORT_STATUS[report.supersededAt ? 'SUPERSEDED' : report.status];
  return <Badge tone={look.tone}>{look.label}</Badge>;
}
