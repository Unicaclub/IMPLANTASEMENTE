import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceMemberRole } from '../enums';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceMemberRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const member = request.workspaceMember;

    if (!member) {
      throw new ForbiddenException('Contexto de workspace necessario para verificacao de papel');
    }

    if (!requiredRoles.includes(member.memberRole)) {
      throw new ForbiddenException('Permissao insuficiente para esta operacao');
    }

    return true;
  }
}
