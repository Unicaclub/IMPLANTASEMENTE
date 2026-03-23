import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComparisonEngineService } from './comparison-engine.service';
import { PipelineHandlerService } from './pipeline-handler.service';

// Registry entities
import { ModuleRegistryEntity } from '../modules-registry/entities/module-registry.entity';
import { ApiRegistryEntity } from '../api-registry/entities/api-registry.entity';
import { RouteRegistryEntity } from '../route-registry/entities/route-registry.entity';
import { SchemaRegistryEntity } from '../schema-registry/entities/schema-registry.entity';
import { UiRegistryEntity } from '../ui-registry/entities/ui-registry.entity';

// Action entities
import { AuditEntity } from '../audits/entities/audit.entity';
import { ReportEntity } from '../reports/entities/report.entity';
import { BacklogItemEntity } from '../backlog/entities/backlog-item.entity';

// Dependent modules
import { ComparisonsModule } from '../comparisons/comparisons.module';

@Module({
  imports: [
    ComparisonsModule,
    TypeOrmModule.forFeature([
      ModuleRegistryEntity,
      ApiRegistryEntity,
      RouteRegistryEntity,
      SchemaRegistryEntity,
      UiRegistryEntity,
      AuditEntity,
      ReportEntity,
      BacklogItemEntity,
    ]),
  ],
  providers: [ComparisonEngineService, PipelineHandlerService],
  exports: [ComparisonEngineService, PipelineHandlerService],
})
export class LlmModule {}
