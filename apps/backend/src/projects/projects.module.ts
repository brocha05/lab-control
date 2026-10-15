import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module.js';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';

/** Owns `projects` (and later `project_test_configurations`, Phase 6). */
@Module({
  imports: [ClientsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
