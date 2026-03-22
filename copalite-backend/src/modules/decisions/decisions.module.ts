import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DecisionEntity } from './entities/decision.entity';
import { DecisionsService } from './decisions.service';
import { DecisionsController } from './decisions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DecisionEntity])],
  controllers: [DecisionsController],
  providers: [DecisionsService],
  exports: [DecisionsService, TypeOrmModule],
})
export class DecisionsModule {}
