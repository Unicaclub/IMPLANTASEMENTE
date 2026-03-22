import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComparisonEntity } from './entities/comparison.entity';
import { DiffEntity } from './entities/diff.entity';
import { ComparisonsService } from './comparisons.service';
import { ComparisonsController } from './comparisons.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ComparisonEntity, DiffEntity])],
  controllers: [ComparisonsController],
  providers: [ComparisonsService],
  exports: [ComparisonsService, TypeOrmModule],
})
export class ComparisonsModule {}
