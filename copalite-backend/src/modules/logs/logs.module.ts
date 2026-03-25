import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogEntity } from './entities/log.entity';
import { WorkspaceMemberEntity } from '../workspaces/entities/workspace-member.entity';
import { AdminGuard } from '../../common/guards/admin.guard';
import { LogsService } from './logs.service';
import { LogsController, AdminLogsController } from './logs.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([LogEntity, WorkspaceMemberEntity])],
  controllers: [LogsController, AdminLogsController],
  providers: [LogsService, AdminGuard],
  exports: [LogsService, TypeOrmModule],
})
export class LogsModule {}
