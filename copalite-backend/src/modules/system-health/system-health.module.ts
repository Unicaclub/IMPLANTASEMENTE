import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemHealthEntity } from './entities/system-health.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { RunEntity } from '../runs/entities/run.entity';
import { SystemHealthService } from './system-health.service';
import { SystemHealthController } from './system-health.controller';
@Module({
  imports: [TypeOrmModule.forFeature([SystemHealthEntity, AgentEntity, RunEntity])],
  controllers: [SystemHealthController],
  providers: [SystemHealthService],
  exports: [SystemHealthService, TypeOrmModule],
})
export class SystemHealthModule {}
