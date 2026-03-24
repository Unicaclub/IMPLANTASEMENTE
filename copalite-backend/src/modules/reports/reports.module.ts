import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BacklogItemEntity } from '../backlog/entities/backlog-item.entity';
import { ComparisonEntity } from '../comparisons/entities/comparison.entity';
import { DiffEntity } from '../comparisons/entities/diff.entity';
import { ModuleRegistryEntity } from '../modules-registry/entities/module-registry.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { RunEntity } from '../runs/entities/run.entity';
import { ReportEntity } from './entities/report.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReportEntity,
      RunEntity,
      ComparisonEntity,
      DiffEntity,
      ModuleRegistryEntity,
      BacklogItemEntity,
    ]),
    NotificationsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService, TypeOrmModule],
})
export class ReportsModule {}
