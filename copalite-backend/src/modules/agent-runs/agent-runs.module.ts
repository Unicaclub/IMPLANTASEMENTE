import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentRunEntity } from './entities/agent-run.entity';
import { AgentRunsService } from './agent-runs.service';
import { AgentRunsController } from './agent-runs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AgentRunEntity])],
  controllers: [AgentRunsController],
  providers: [AgentRunsService],
  exports: [AgentRunsService, TypeOrmModule],
})
export class AgentRunsModule {}
