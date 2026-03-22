import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

import { ProjectEntity } from '../projects/entities/project.entity';
import { SourceEntity } from '../sources/entities/source.entity';
import { RunEntity } from '../runs/entities/run.entity';
import { ModuleRegistryEntity } from '../modules-registry/entities/module-registry.entity';
import { RouteRegistryEntity } from '../route-registry/entities/route-registry.entity';
import { ApiRegistryEntity } from '../api-registry/entities/api-registry.entity';
import { SchemaRegistryEntity } from '../schema-registry/entities/schema-registry.entity';
import { UiRegistryEntity } from '../ui-registry/entities/ui-registry.entity';
import { EvidenceRegistryEntity } from '../evidence-registry/entities/evidence-registry.entity';
import { BacklogItemEntity } from '../backlog/entities/backlog-item.entity';
import { TaskEntity } from '../tasks/entities/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      SourceEntity,
      RunEntity,
      ModuleRegistryEntity,
      RouteRegistryEntity,
      ApiRegistryEntity,
      SchemaRegistryEntity,
      UiRegistryEntity,
      EvidenceRegistryEntity,
      BacklogItemEntity,
      TaskEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
