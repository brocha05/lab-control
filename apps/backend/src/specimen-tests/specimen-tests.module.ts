import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CatalogsModule } from '../catalogs/catalogs.module.js';
import { SpecimenTestsController } from './specimen-tests.controller.js';
import { SpecimenTestsService } from './specimen-tests.service.js';

/**
 * Lab testing. Owns `specimen_tests` (URL `/tests`). Plans tests when the field-records
 * module completes a record, and lists the pending ones with their derived dates.
 */
@Module({
  imports: [AuthModule, CatalogsModule],
  controllers: [SpecimenTestsController],
  providers: [SpecimenTestsService],
  exports: [SpecimenTestsService],
})
export class SpecimenTestsModule {}
