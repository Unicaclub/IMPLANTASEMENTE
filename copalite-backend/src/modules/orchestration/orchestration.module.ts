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
import { NotificationsModule } from '../notifications/notifications.module';
import { LlmModule } from '../llm/llm.module';

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
