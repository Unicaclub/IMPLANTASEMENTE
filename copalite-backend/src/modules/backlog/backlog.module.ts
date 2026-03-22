import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BacklogItemEntity } from './entities/backlog-item.entity';
import { BacklogService } from './backlog.service';
import { BacklogController } from './backlog.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([BacklogItemEntity]), NotificationsModule],
  controllers: [BacklogController],
  providers: [BacklogService],
  exports: [BacklogService, TypeOrmModule],
})
export class BacklogModule {}
