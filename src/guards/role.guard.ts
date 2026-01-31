import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminScope, Role } from 'generated/prisma/enums';
import { ROLES_KEY, SCOPES_KEY } from 'src/decorators/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredScopes = this.reflector.getAllAndOverride<AdminScope[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have access rights to perform this action!',
      );
    }

    if (user.role === Role.ADMIN && requiredScopes && requiredScopes.length > 0) {
      if (!user.adminScopes || user.adminScopes.length === 0) {
        throw new ForbiddenException(
          'You do not have access rights to perform this action!',
        );
      }

      const hasScope = requiredScopes.some(scope => user.adminScopes.includes(scope));

      return hasScope;
    }

    return true;
  }
}
