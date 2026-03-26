import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentRunEntity } from '../agent-runs/entities/agent-run.entity';
import { AgentOutputEntity } from './entities/agent-output.entity';
import { AgentOutputsService } from './agent-outputs.service';
import { AgentOutputsController } from './agent-outputs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AgentOutputEntity, AgentRunEntity])],
  controllers: [AgentOutputsController],
  providers: [AgentOutputsService],
  exports: [AgentOutputsService, TypeOrmModule],
})
export class AgentOutputsModule {}
