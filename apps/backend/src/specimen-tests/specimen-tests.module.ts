import { Module } from '@nestjs/common';
import { SpecimenTestsService } from './specimen-tests.service.js';

/**
 * Lab testing. Owns `specimen_tests` (URL `/tests`). Plans tests when the field-records
 * module completes a record; schedules, pending lists and results build on it.
 */
@Module({
  providers: [SpecimenTestsService],
  exports: [SpecimenTestsService],
})
export class SpecimenTestsModule {}
