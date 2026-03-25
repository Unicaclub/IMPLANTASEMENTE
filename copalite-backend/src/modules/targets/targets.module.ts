import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowserRunsModule } from '../browser-runs/browser-runs.module';
import { TargetSessionsModule } from '../target-sessions/target-sessions.module';
import { TargetEntity } from './entities/target.entity';
import { TargetsController } from './targets.controller';
import { TargetsService } from './targets.service';

@Module({
  imports: [TypeOrmModule.forFeature([TargetEntity]), BrowserRunsModule, TargetSessionsModule],
  controllers: [TargetsController],
  providers: [TargetsService],
  exports: [TargetsService, TypeOrmModule],
})
export class TargetsModule {}
