import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CodebaseMapEntity } from './entities/codebase-map.entity';
import { CodebaseMapService } from './codebase-map.service';
import { CodebaseMapController } from './codebase-map.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CodebaseMapEntity])],
  controllers: [CodebaseMapController],
  providers: [CodebaseMapService],
  exports: [CodebaseMapService, TypeOrmModule],
})
export class CodebaseMapModule {}
