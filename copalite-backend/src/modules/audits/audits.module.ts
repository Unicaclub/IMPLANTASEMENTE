import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComparisonEntity } from '../comparisons/entities/comparison.entity';
import { DiffEntity } from '../comparisons/entities/diff.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { RunEntity } from '../runs/entities/run.entity';
import { AuditEntity } from './entities/audit.entity';
import { AuditsService } from './audits.service';
import { AuditsController } from './audits.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditEntity, ComparisonEntity, DiffEntity, RunEntity]),
    NotificationsModule,
  ],
  controllers: [AuditsController],
  providers: [AuditsService],
  exports: [AuditsService, TypeOrmModule],
})
export class AuditsModule {}
