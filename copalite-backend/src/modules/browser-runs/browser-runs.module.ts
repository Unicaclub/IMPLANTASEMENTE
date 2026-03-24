import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowserEvidenceEntity } from '../browser-evidence/entities/browser-evidence.entity';
import { BrowserEvidenceModule } from '../browser-evidence/browser-evidence.module';
import { BrowserProblemsModule } from '../browser-problems/browser-problems.module';
import { TargetEntity } from '../targets/entities/target.entity';
import { TargetSessionEntity } from '../target-sessions/entities/target-session.entity';
import { BrowserRunEntity } from './entities/browser-run.entity';
import { BrowserAgentService } from './browser-agent.service';
import { BrowserRunsController } from './browser-runs.controller';
import { BrowserRunsService } from './browser-runs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BrowserRunEntity, BrowserEvidenceEntity, TargetEntity, TargetSessionEntity]),
    BrowserEvidenceModule,
    BrowserProblemsModule,
  ],
  controllers: [BrowserRunsController],
  providers: [BrowserRunsService, BrowserAgentService],
  exports: [BrowserRunsService, BrowserAgentService, TypeOrmModule],
})
export class BrowserRunsModule {}
