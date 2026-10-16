import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module.js';
import { ClientsModule } from '../clients/clients.module.js';
import { FieldRecordsModule } from '../field-records/field-records.module.js';
import type { Env } from '../shared/config/env.validation.js';
import { SpecimenTestsModule } from '../specimen-tests/specimen-tests.module.js';
import { createReportRenderer, ReportRenderer } from './rendering/report-renderer.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { createReportStorage, ReportStorage } from './storage/report-storage.js';

/** FPC06-04 reports (Phase 9). Owns `reports`; PDFs in private storage (ADR-005/006). */
@Module({
  imports: [AuthModule, ClientsModule, FieldRecordsModule, SpecimenTestsModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    {
      provide: ReportRenderer,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createReportRenderer({
          PDF_RENDERER: config.get('PDF_RENDERER', { infer: true }),
          PDF_CHROMIUM_PATH: config.get('PDF_CHROMIUM_PATH', { infer: true }),
        }),
    },
    {
      provide: ReportStorage,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createReportStorage({
          REPORT_STORAGE_DRIVER: config.get('REPORT_STORAGE_DRIVER', { infer: true }),
          REPORT_STORAGE_DIR: config.get('REPORT_STORAGE_DIR', { infer: true }),
          S3_ENDPOINT: config.get('S3_ENDPOINT', { infer: true }),
          S3_REGION: config.get('S3_REGION', { infer: true }),
          S3_BUCKET: config.get('S3_BUCKET', { infer: true }),
          S3_ACCESS_KEY_ID: config.get('S3_ACCESS_KEY_ID', { infer: true }),
          S3_SECRET_ACCESS_KEY: config.get('S3_SECRET_ACCESS_KEY', { infer: true }),
        }),
    },
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
