import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowserRunEntity } from '../browser-runs/entities/browser-run.entity';
import { BrowserEvidenceEntity } from './entities/browser-evidence.entity';
import { BrowserEvidenceController } from './browser-evidence.controller';
import { BrowserEvidenceService } from './browser-evidence.service';

@Module({
  imports: [TypeOrmModule.forFeature([BrowserEvidenceEntity, BrowserRunEntity])],
  controllers: [BrowserEvidenceController],
  providers: [BrowserEvidenceService],
  exports: [BrowserEvidenceService, TypeOrmModule],
})
export class BrowserEvidenceModule {}
