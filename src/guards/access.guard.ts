// guards/category-access.guard.ts
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from 'generated/prisma/enums';

@Injectable()
export class CategoryAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const body = request.body;

    if (!user || user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can add new product.');
    }

    if (!body.category) {
      throw new BadRequestException('Category is required to check permissions');
    }

    const hasPermission = user.adminScopes.includes(body.category);

    if (!hasPermission) {
      throw new ForbiddenException(`You have no permission: ${body.category}`);
    }

    return true;
  }
}
