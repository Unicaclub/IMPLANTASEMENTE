import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RunEntity } from './entities/run.entity';
import { RunStepEntity } from './entities/run-step.entity';
import { RunsService } from './runs.service';
import { RunsController } from './runs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RunEntity, RunStepEntity])],
  controllers: [RunsController],
  providers: [RunsService],
  exports: [RunsService, TypeOrmModule],
})
export class RunsModule {}
