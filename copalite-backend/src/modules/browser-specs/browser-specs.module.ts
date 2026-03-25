import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowserEvidenceEntity } from '../browser-evidence/entities/browser-evidence.entity';
import { BrowserProblemEntity } from '../browser-problems/entities/browser-problem.entity';
import { BrowserProblemsModule } from '../browser-problems/browser-problems.module';
import { BrowserRunEntity } from '../browser-runs/entities/browser-run.entity';
import { BrowserSpecEntity } from './entities/browser-spec.entity';
import { BrowserSpecsController } from './browser-specs.controller';
import { BrowserSpecsService } from './browser-specs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BrowserRunEntity, BrowserEvidenceEntity, BrowserProblemEntity, BrowserSpecEntity]),
    BrowserProblemsModule,
  ],
  controllers: [BrowserSpecsController],
  providers: [BrowserSpecsService],
  exports: [BrowserSpecsService],
})
export class BrowserSpecsModule {}
