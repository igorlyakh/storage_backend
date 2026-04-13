import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminScope, WarehouseRequestStatus } from 'generated/prisma/enums';
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
      select: { id: true, category: true },
    });

    if (products.length !== dto.items.length) {
      throw new BadRequestException('Один или несколько товаров не найдены');
    }

    const groupedItems = new Map<AdminScope, { productId: string; quantity: number }[]>();

    for (const item of dto.items) {
      const product = products.find(p => p.id === item.productId);
      if (!groupedItems.has(product.category)) {
        groupedItems.set(product.category, []);
      }
      groupedItems.get(product.category).push(item);
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
        items: { include: { product: true } },
      },
    });
  }

  async updateStatus(id: string, dto: UpdateRequestStatusDto) {
    const request = await this.prisma.warehouseRequest.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!request) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (
      dto.status === WarehouseRequestStatus.COMPLETED &&
      request.status !== WarehouseRequestStatus.COMPLETED
    ) {
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

    return this.prisma.warehouseRequest.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
