import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityHistoryModule } from '../activity-history/activity-history.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RunStepEntity } from './entities/run-step.entity';
import { RunEntity } from './entities/run.entity';
import { RunsController } from './runs.controller';
import { RunsService } from './runs.service';

@Module({
  imports: [TypeOrmModule.forFeature([RunEntity, RunStepEntity]), ActivityHistoryModule, NotificationsModule],
  controllers: [RunsController],
  providers: [RunsService],
  exports: [RunsService, TypeOrmModule],
})
export class RunsModule {}
