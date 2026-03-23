import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrchestrationService } from './orchestration.service';
import { OrchestrationController } from './orchestration.controller';

// Entities needed by the orchestration engine
import { RunEntity } from '../runs/entities/run.entity';
import { RunStepEntity } from '../runs/entities/run-step.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { AgentRunEntity } from '../agent-runs/entities/agent-run.entity';
import { AgentOutputEntity } from '../agent-outputs/entities/agent-output.entity';
import { LogEntity } from '../logs/entities/log.entity';
import { AuditEntity } from '../audits/entities/audit.entity';
import { ReportEntity } from '../reports/entities/report.entity';
import { BacklogItemEntity } from '../backlog/entities/backlog-item.entity';
import { ModuleRegistryEntity } from '../modules-registry/entities/module-registry.entity';
import { ApiRegistryEntity } from '../api-registry/entities/api-registry.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ComparisonsModule } from '../comparisons/comparisons.module';
import { ComparisonEngineService } from '../llm/comparison-engine.service';
import { PipelineHandlerService } from '../llm/pipeline-handler.service';
import { RouteRegistryEntity } from '../route-registry/entities/route-registry.entity';
import { SchemaRegistryEntity } from '../schema-registry/entities/schema-registry.entity';
import { UiRegistryEntity } from '../ui-registry/entities/ui-registry.entity';

@Module({
  imports: [
    NotificationsModule,
    ComparisonsModule,
    TypeOrmModule.forFeature([
      RunEntity,
      RunStepEntity,
      AgentEntity,
      AgentRunEntity,
      AgentOutputEntity,
      LogEntity,
      AuditEntity,
      ReportEntity,
      BacklogItemEntity,
      ModuleRegistryEntity,
      ApiRegistryEntity,
      RouteRegistryEntity,
      SchemaRegistryEntity,
      UiRegistryEntity,
    ]),
  ],
  controllers: [OrchestrationController],
  providers: [OrchestrationService, ComparisonEngineService, PipelineHandlerService],
  exports: [OrchestrationService],
})
export class OrchestrationModule {}
