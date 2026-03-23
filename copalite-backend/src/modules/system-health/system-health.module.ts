import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemHealthEntity } from './entities/system-health.entity';
import { AgentEntity } from '../agents/entities/agent.entity';
import { RunEntity } from '../runs/entities/run.entity';
import { HealthController } from './health.controller';
import { SystemHealthController } from './system-health.controller';
import { SystemHealthService } from './system-health.service';
@Module({
  imports: [TypeOrmModule.forFeature([SystemHealthEntity, AgentEntity, RunEntity])],
  controllers: [SystemHealthController, HealthController],
  providers: [SystemHealthService],
  exports: [SystemHealthService, TypeOrmModule],
})
export class SystemHealthModule {}
