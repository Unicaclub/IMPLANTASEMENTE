import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TargetSessionEntity } from './entities/target-session.entity';
import { TargetSessionsController } from './target-sessions.controller';
import { TargetSessionsService } from './target-sessions.service';

@Module({
  imports: [TypeOrmModule.forFeature([TargetSessionEntity])],
  controllers: [TargetSessionsController],
  providers: [TargetSessionsService],
  exports: [TargetSessionsService, TypeOrmModule],
})
export class TargetSessionsModule {}
