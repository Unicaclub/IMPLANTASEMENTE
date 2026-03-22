import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityHistoryEntity } from './entities/activity-history.entity';
import { ActivityHistoryService } from './activity-history.service';
import { ActivityHistoryController } from './activity-history.controller';
@Module({ imports: [TypeOrmModule.forFeature([ActivityHistoryEntity])], controllers: [ActivityHistoryController], providers: [ActivityHistoryService], exports: [ActivityHistoryService, TypeOrmModule] })
export class ActivityHistoryModule {}
