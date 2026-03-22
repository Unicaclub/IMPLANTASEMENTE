import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportEntity } from './entities/report.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
@Module({ imports: [TypeOrmModule.forFeature([ReportEntity])], controllers: [ReportsController], providers: [ReportsService], exports: [ReportsService, TypeOrmModule] })
export class ReportsModule {}
