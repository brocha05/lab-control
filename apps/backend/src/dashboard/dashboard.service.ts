import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { ClientsService } from '../clients/clients.service.js';
import { FieldRecordsService } from '../field-records/field-records.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import { ReportsService } from '../reports/reports.service.js';
import { addDays, CalendarDate } from '../shared/dates/calendar-date.js';
import { SpecimenTestsService } from '../specimen-tests/specimen-tests.service.js';
import { countPendingTests, type TestCounts } from './domain/summary.js';

/** Days after today counted as "upcoming", same window as the pending list's default. */
const WINDOW_DAYS = 7;

export interface DashboardSummary {
  today: CalendarDate;
  /** Last day counted as upcoming. */
  until: CalendarDate;
  clients: number;
  projects: number;
  tests: TestCounts;
  draftFieldRecords: number;
  /** Report versions not yet issued (DRAFT or GENERATED). */
  pendingReports: number;
}

/** Counts for the home screen (8.4). Owns no table; reads through the other modules. */
@Injectable()
export class DashboardService {
  constructor(
    private readonly auth: AuthService,
    private readonly clients: ClientsService,
    private readonly projects: ProjectsService,
    private readonly fieldRecords: FieldRecordsService,
    private readonly specimenTests: SpecimenTestsService,
    private readonly reports: ReportsService,
  ) {}

  async summary(tenantId: string): Promise<DashboardSummary> {
    const today = await this.auth.tenantToday(tenantId);
    const until = addDays(today, WINDOW_DAYS);
    const [clients, projects, pending, draftFieldRecords, pendingReports] = await Promise.all([
      this.clients.count(tenantId),
      this.projects.count(tenantId),
      this.specimenTests.pending(tenantId, { until }),
      this.fieldRecords.countDrafts(tenantId),
      this.reports.countPending(tenantId),
    ]);
    return {
      today,
      until,
      clients,
      projects,
      tests: countPendingTests(pending),
      draftFieldRecords,
      pendingReports,
    };
  }
}
