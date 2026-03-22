import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditEntity } from './entities/audit.entity';
import { AuditsService } from './audits.service';
import { AuditsController } from './audits.controller';
@Module({ imports: [TypeOrmModule.forFeature([AuditEntity])], controllers: [AuditsController], providers: [AuditsService], exports: [AuditsService, TypeOrmModule] })
export class AuditsModule {}
