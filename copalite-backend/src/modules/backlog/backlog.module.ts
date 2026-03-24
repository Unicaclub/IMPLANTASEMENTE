import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityHistoryModule } from '../activity-history/activity-history.module';
import { ComparisonEntity } from '../comparisons/entities/comparison.entity';
import { DiffEntity } from '../comparisons/entities/diff.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { BacklogController } from './backlog.controller';
import { BacklogService } from './backlog.service';
import { BacklogItemEntity } from './entities/backlog-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BacklogItemEntity, ComparisonEntity, DiffEntity]),
    NotificationsModule,
    ActivityHistoryModule,
  ],
  controllers: [BacklogController],
  providers: [BacklogService],
  exports: [BacklogService, TypeOrmModule],
})
export class BacklogModule {}
