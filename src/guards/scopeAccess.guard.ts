import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ScopeAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user, params, body } = request;

    if (!user || user.role !== 'ADMIN') return true;

    const productId = params.id || body.id;

    if (!productId) {
      throw new BadRequestException('Product ID not found');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { tag: true },
    });

    if (!product) throw new NotFoundException();

    if (!user.adminScopes.includes(product.tag)) {
      throw new ForbiddenException(`You do not have permission: ${product.tag}`);
    }

    return true;
  }
}
