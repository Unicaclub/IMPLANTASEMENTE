import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../../modules/projects/entities/project.entity';
import { WorkspaceMemberEntity } from '../../modules/workspaces/entities/workspace-member.entity';
import { StatusBase } from '../enums';

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private readonly memberRepo: Repository<WorkspaceMemberEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    // Resolve projectId ONLY from explicit sources.
    // NEVER use params.id — it's ambiguous (could be backlog id, run id, etc.)
    const projectId =
      request.params?.projectId ||
      request.query?.projectId ||
      request.body?.projectId;

    if (!projectId) {
      // No explicit project context — let the request through.
      // JWT guard already ensures authentication.
      // Entity-level access is validated by the service layer.
      return true;
    }

    // Find the project to get workspaceId
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      select: ['id', 'workspaceId'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check workspace membership
    const member = await this.memberRepo.findOne({
      where: {
        workspaceId: project.workspaceId,
        userId,
        status: StatusBase.ACTIVE,
      },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this project\'s workspace');
    }

    // Attach to request for downstream use
    request.workspaceMember = member;
    request.resolvedProject = project;
    return true;
  }
}
