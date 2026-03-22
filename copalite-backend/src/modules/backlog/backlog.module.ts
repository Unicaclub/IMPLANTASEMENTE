import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityHistoryModule } from '../activity-history/activity-history.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BacklogController } from './backlog.controller';
import { BacklogService } from './backlog.service';
import { BacklogItemEntity } from './entities/backlog-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BacklogItemEntity]), NotificationsModule, ActivityHistoryModule],
  controllers: [BacklogController],
  providers: [BacklogService],
  exports: [BacklogService, TypeOrmModule],
})
export class BacklogModule {}
