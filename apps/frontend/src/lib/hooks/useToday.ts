'use client';

import { todayCalendarDate } from '@/lib/utils/formatters';
import { useCurrentUser } from '@/modules/auth/hooks/useAuth';

/** "Today" in the lab's timezone (A-14). */
export function useToday(): string {
  const me = useCurrentUser();
  return todayCalendarDate(me.data?.tenant.timezone);
}
