import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ClientsModule } from '../clients/clients.module.js';
import { FieldRecordsModule } from '../field-records/field-records.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { ReportsModule } from '../reports/reports.module.js';
import { SpecimenTestsModule } from '../specimen-tests/specimen-tests.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

/** Home-screen counts (8.4). Derived only, owns no table. */
@Module({
  imports: [
    AuthModule,
    ClientsModule,
    ProjectsModule,
    FieldRecordsModule,
    SpecimenTestsModule,
    ReportsModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
