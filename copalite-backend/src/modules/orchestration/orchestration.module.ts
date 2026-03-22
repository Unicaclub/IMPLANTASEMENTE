import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrchestrationController } from './orchestration.controller';
import { OrchestrationService } from './orchestration.service';

// Entities needed by the orchestration engine
import { AgentOutputEntity } from '../agent-outputs/entities/agent-output.entity';
import { AgentRunEntity } from '../agent-runs/entities/agent-run.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { LlmModule } from '../llm/llm.module';
import { LogEntity } from '../logs/entities/log.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { RunStepEntity } from '../runs/entities/run-step.entity';
import { RunEntity } from '../runs/entities/run.entity';

@Module({
  imports: [
    NotificationsModule,
    LlmModule,
    TypeOrmModule.forFeature([
      RunEntity,
      RunStepEntity,
      AgentEntity,
      AgentRunEntity,
      AgentOutputEntity,
      LogEntity,
    ]),
  ],
  controllers: [OrchestrationController],
  providers: [OrchestrationService],
  exports: [OrchestrationService],
})
export class OrchestrationModule {}
