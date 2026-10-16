import { Module } from '@nestjs/common';
import { CatalogsModule } from '../catalogs/catalogs.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { BitacoraController } from './bitacora.controller.js';
import { BitacoraService } from './bitacora.service.js';

/**
 * The Bitácora (FPC01-02): a read-only view over field records and test results.
 * Owns no table (ADR-004).
 */
@Module({
  imports: [ProjectsModule, CatalogsModule],
  controllers: [BitacoraController],
  providers: [BitacoraService],
})
export class BitacoraModule {}
