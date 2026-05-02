import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class ScopeCreateGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user, body } = context.switchToHttp().getRequest();

    if (!user || user.role !== 'ADMIN') return true;

    if (!body.tag) {
      throw new BadRequestException('Tag is required');
    }

    if (!user.adminScopes.includes(body.tag)) {
      throw new ForbiddenException(`You do not have permission: ${body.category}`);
    }
    return true;
  }
}
