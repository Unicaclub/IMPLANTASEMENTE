import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMemberEntity } from '../../modules/workspaces/entities/workspace-member.entity';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(
    @InjectRepository(WorkspaceMemberEntity)
    private readonly memberRepo: Repository<WorkspaceMemberEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub || request.user?.id;
    const workspaceId =
      request.params?.workspaceId ||
      request.body?.workspaceId ||
      request.query?.workspaceId;

    if (!userId || !workspaceId) {
      throw new ForbiddenException('Workspace context required');
    }

    const member = await this.memberRepo.findOne({
      where: {
        workspaceId,
        userId,
        status: 'active' as any,
      },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    request.workspaceMember = member;
    return true;
  }
}
