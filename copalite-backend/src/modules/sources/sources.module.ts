import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SourceEntity } from './entities/source.entity';
import { SourcesService } from './sources.service';
import { SourcesController } from './sources.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SourceEntity])],
  controllers: [SourcesController],
  providers: [SourcesService],
  exports: [SourcesService, TypeOrmModule],
})
export class SourcesModule {}
