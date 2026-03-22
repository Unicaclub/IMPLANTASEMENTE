import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentOutputEntity } from './entities/agent-output.entity';
import { AgentOutputsService } from './agent-outputs.service';
import { AgentOutputsController } from './agent-outputs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AgentOutputEntity])],
  controllers: [AgentOutputsController],
  providers: [AgentOutputsService],
  exports: [AgentOutputsService, TypeOrmModule],
})
export class AgentOutputsModule {}
