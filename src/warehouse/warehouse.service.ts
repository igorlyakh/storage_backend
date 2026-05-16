import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminScope, Role, WarehouseRequestStatus } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWarehouseRequestDto } from './dto/create-warehouse-request.dto';
import { OperationDto } from './dto/operation.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async increaseItem(dto: OperationDto) {
    const candidate = await this.prisma.warehouseStock.findUnique({
      where: { productId: dto.id },
    });

    if (!candidate) {
      throw new NotFoundException('Product not found!');
    }

    const result = await this.prisma.warehouseStock.update({
      where: { productId: dto.id },
      data: {
        quantity: {
          increment: dto.quantity,
        },
      },
    });

    return result;
  }

  async decreaseItem(dto: OperationDto) {
    const candidate = await this.prisma.warehouseStock.findUnique({
      where: { productId: dto.id },
    });

    if (!candidate) {
      throw new NotFoundException('Product not found!');
    }

    if (candidate.quantity < dto.quantity) {
      throw new BadRequestException('Not enough item in stock');
    }

    const result = await this.prisma.warehouseStock.update({
      where: { productId: dto.id },
      data: {
        quantity: {
          decrement: dto.quantity,
        },
      },
    });

    return result;
  }

  async createRequest(userId: string, dto: CreateWarehouseRequestDto) {
    const productIds = dto.items.map(item => item.productId);

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, tag: true },
    });

    if (products.length !== dto.items.length) {
      throw new BadRequestException('Products not found');
    }

    const groupedItems = new Map<AdminScope, { productId: string; quantity: number }[]>();

    for (const item of dto.items) {
      const product = products.find(p => p.id === item.productId);
      if (!groupedItems.has(product.tag)) {
        groupedItems.set(product.tag, []);
      }
      groupedItems.get(product.tag).push(item);
    }

    const requests = [];
    await this.prisma.$transaction(async tx => {
      for (const [category, items] of groupedItems) {
        const newRequest = await tx.warehouseRequest.create({
          data: {
            category,
            createdBy: userId,
            items: {
              create: items.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
              })),
            },
          },
        });
        requests.push(newRequest);
      }
    });

    return requests;
  }

  async getAdminRequests(adminScopes: AdminScope[]) {
    return this.prisma.warehouseRequest.findMany({
      where: {
        category: { in: adminScopes },
      },
      include: {
        items: { include: { product: { include: { category: true } } } },
      },
    });
  }

  async updateStatus(id: string, dto: UpdateRequestStatusDto, user: any) {
    const request = await this.prisma.warehouseRequest.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!request) {
      throw new NotFoundException('Order not found');
    }

    if (dto.status === WarehouseRequestStatus.COMPLETED) {
      if (request.status === WarehouseRequestStatus.COMPLETED) {
        throw new BadRequestException('Order already closed');
      }

      return this.prisma.$transaction(async tx => {
        for (const item of request.items) {
          await tx.warehouseStock.upsert({
            where: { productId: item.productId },
            create: {
              productId: item.productId,
              quantity: item.quantity,
            },
            update: {
              quantity: { increment: item.quantity },
            },
          });
        }

        return tx.warehouseRequest.update({
          where: { id },
          data: { status: WarehouseRequestStatus.COMPLETED },
        });
      });
    }

    if (
      dto.status === WarehouseRequestStatus.APPROVED ||
      dto.status === WarehouseRequestStatus.SENT
    ) {
      if (user.role !== Role.ADMIN) {
        throw new ForbiddenException('Only for admins');
      }

      if (!user.adminScopes?.includes(request.category)) {
        throw new ForbiddenException(`Not your scope: ${request.category}`);
      }
    }

    return this.prisma.warehouseRequest.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async getWarehouseRequests() {
    return this.prisma.warehouseRequest.findMany({
      include: {
        items: {
          include: { product: { include: { category: true } } },
        },
        creator: {
          select: { username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWarehouseRequestById(id: string) {
    return this.prisma.warehouseRequest.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: { include: { category: true } } },
        },
      },
    });
  }
}
