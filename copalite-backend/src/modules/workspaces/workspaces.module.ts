import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceEntity } from './entities/workspace.entity';
import { WorkspaceMemberEntity } from './entities/workspace-member.entity';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceEntity, WorkspaceMemberEntity])],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService, TypeOrmModule],
})
export class WorkspacesModule {}
