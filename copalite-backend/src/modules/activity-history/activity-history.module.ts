import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from '../projects/entities/project.entity';
import { ActivityHistoryController } from './activity-history.controller';
import { ActivityHistoryService } from './activity-history.service';
import { ActivityHistoryEntity } from './entities/activity-history.entity';
@Module({ imports: [TypeOrmModule.forFeature([ActivityHistoryEntity, ProjectEntity])], controllers: [ActivityHistoryController], providers: [ActivityHistoryService], exports: [ActivityHistoryService, TypeOrmModule] })
export class ActivityHistoryModule {}
