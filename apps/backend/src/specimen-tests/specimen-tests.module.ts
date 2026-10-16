import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CatalogsModule } from '../catalogs/catalogs.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { SpecimenTestsController } from './specimen-tests.controller.js';
import { SpecimenTestsService } from './specimen-tests.service.js';

/**
 * Lab testing. Owns `specimen_tests` (URL `/tests`). Plans tests when the field-records
 * module completes a record, lists the pending ones with their derived dates, and records
 * the press readings per FPC06-01 worksheet.
 */
@Module({
  imports: [AuthModule, CatalogsModule, ProjectsModule],
  controllers: [SpecimenTestsController],
  providers: [SpecimenTestsService],
  exports: [SpecimenTestsService],
})
export class SpecimenTestsModule {}
