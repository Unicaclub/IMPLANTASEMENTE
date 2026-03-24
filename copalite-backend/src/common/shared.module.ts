import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from '../modules/projects/entities/project.entity';
import { WorkspaceMemberEntity } from '../modules/workspaces/entities/workspace-member.entity';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ExecutionLockService } from './utils/execution-lock.service';
import { ArtifactCleanupService } from './utils/artifact-cleanup.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, WorkspaceMemberEntity]),
  ],
  providers: [ProjectAccessGuard, ExecutionLockService, ArtifactCleanupService],
  exports: [ProjectAccessGuard, ExecutionLockService, ArtifactCleanupService, TypeOrmModule],
})
export class SharedModule {}
