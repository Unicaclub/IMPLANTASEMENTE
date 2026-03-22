import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from '../modules/projects/entities/project.entity';
import { WorkspaceMemberEntity } from '../modules/workspaces/entities/workspace-member.entity';
import { ProjectAccessGuard } from './guards/project-access.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, WorkspaceMemberEntity]),
  ],
  providers: [ProjectAccessGuard],
  exports: [ProjectAccessGuard, TypeOrmModule],
})
export class SharedModule {}
