import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WorkspaceMemberEntity } from '../../modules/workspaces/entities/workspace-member.entity';
import { StatusBase, WorkspaceMemberRole } from '../enums';

/**
 * Verifies the authenticated user is OWNER or ADMIN in at least one workspace.
 * Used for admin-only endpoints that don't have a specific workspace context.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(WorkspaceMemberEntity)
    private readonly memberRepo: Repository<WorkspaceMemberEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub || request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Autenticacao necessaria');
    }

    const adminMembership = await this.memberRepo.findOne({
      where: {
        userId,
        status: StatusBase.ACTIVE,
        memberRole: In([WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN]),
      },
    });

    if (!adminMembership) {
      throw new ForbiddenException('Acesso restrito a administradores');
    }

    return true;
  }
}
