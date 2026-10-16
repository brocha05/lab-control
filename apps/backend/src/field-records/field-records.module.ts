import { Module } from '@nestjs/common';
import { CatalogsModule } from '../catalogs/catalogs.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { FieldRecordsController } from './field-records.controller.js';
import { FieldRecordsService } from './field-records.service.js';

/**
 * Field capture (FPC01-01). Owns `field_records`, `deliveries`, `samples`, `specimens`:
 * they are captured together on one form (docs/architecture/overview.md).
 */
@Module({
  imports: [ProjectsModule, CatalogsModule],
  controllers: [FieldRecordsController],
  providers: [FieldRecordsService],
  exports: [FieldRecordsService],
})
export class FieldRecordsModule {}
