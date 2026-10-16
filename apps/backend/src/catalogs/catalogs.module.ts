import { Module } from '@nestjs/common';
import {
  CementTypesController,
  HolidaysController,
  SuppliersController,
} from './catalogs.controller.js';
import { CatalogsService } from './catalogs.service.js';
import { HolidaysService } from './holidays.service.js';

/**
 * Lab-level lists: concrete suppliers and cement types (Q-06) and the holiday calendar
 * (Q-21, Q-81). Owns `concrete_suppliers`, `cement_types`, `holidays`.
 */
@Module({
  controllers: [SuppliersController, CementTypesController, HolidaysController],
  providers: [CatalogsService, HolidaysService],
  exports: [CatalogsService, HolidaysService],
})
export class CatalogsModule {}
