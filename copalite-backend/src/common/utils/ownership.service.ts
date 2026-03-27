import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../../modules/projects/entities/project.entity';
import { WorkspaceMemberEntity } from '../../modules/workspaces/entities/workspace-member.entity';
import { StatusBase } from '../enums';

@Injectable()
export class OwnershipService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private readonly memberRepo: Repository<WorkspaceMemberEntity>,
  ) {}

  async assertProjectMembership(projectId: string, userId: string): Promise<void> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.assertWorkspaceMembership(project.workspaceId, userId);
  }

  async assertWorkspaceMembership(workspaceId: string, userId: string): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { workspaceId, userId, status: StatusBase.ACTIVE },
    });
    if (!member) {
      throw new ForbiddenException('Not a member of this workspace');
    }
  }
}
