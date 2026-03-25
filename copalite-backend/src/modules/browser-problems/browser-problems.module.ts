import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowserProblemEntity } from './entities/browser-problem.entity';
import { BrowserProblemsController } from './browser-problems.controller';
import { BrowserProblemsService } from './browser-problems.service';

@Module({
  imports: [TypeOrmModule.forFeature([BrowserProblemEntity])],
  controllers: [BrowserProblemsController],
  providers: [BrowserProblemsService],
  exports: [BrowserProblemsService, TypeOrmModule],
})
export class BrowserProblemsModule {}
