import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowserRunEntity } from '../browser-runs/entities/browser-run.entity';
import { TargetEntity } from '../targets/entities/target.entity';
import { JourneyRunEntity } from './entities/journey-run.entity';
import { JourneyStepResultEntity } from './entities/journey-step-result.entity';
import { JourneysController } from './journeys.controller';
import { JourneyRunnerService } from './journey-runner.service';

@Module({
  imports: [TypeOrmModule.forFeature([JourneyRunEntity, JourneyStepResultEntity, TargetEntity, BrowserRunEntity])],
  controllers: [JourneysController],
  providers: [JourneyRunnerService],
  exports: [JourneyRunnerService, TypeOrmModule],
})
export class JourneysModule {}
