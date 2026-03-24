import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrchestrationController } from './orchestration.controller';
import { OrchestrationService } from './orchestration.service';
import { RunWatchdogService } from './run-watchdog.service';

// Entities needed by the orchestration engine
import { AgentOutputEntity } from '../agent-outputs/entities/agent-output.entity';
import { AgentRunEntity } from '../agent-runs/entities/agent-run.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { LlmModule } from '../llm/llm.module';
import { LogEntity } from '../logs/entities/log.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectEntity } from '../projects/entities/project.entity';
import { RunStepEntity } from '../runs/entities/run-step.entity';
import { RunEntity } from '../runs/entities/run.entity';

// Post-pipeline modules
import { BacklogModule } from '../backlog/backlog.module';
import { AuditsModule } from '../audits/audits.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    NotificationsModule,
    LlmModule,
    BacklogModule,
    AuditsModule,
    ReportsModule,
    TypeOrmModule.forFeature([
      RunEntity,
      RunStepEntity,
      AgentEntity,
      AgentRunEntity,
      AgentOutputEntity,
      LogEntity,
      ProjectEntity,
    ]),
  ],
  controllers: [OrchestrationController],
  providers: [OrchestrationService, RunWatchdogService],
  exports: [OrchestrationService],
})
export class OrchestrationModule {}
