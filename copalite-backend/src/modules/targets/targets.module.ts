import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TargetEntity } from './entities/target.entity';
import { TargetsController } from './targets.controller';
import { TargetsService } from './targets.service';

@Module({
  imports: [TypeOrmModule.forFeature([TargetEntity])],
  controllers: [TargetsController],
  providers: [TargetsService],
  exports: [TargetsService, TypeOrmModule],
})
export class TargetsModule {}
