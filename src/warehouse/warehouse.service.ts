import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminScope, Role, WarehouseRequestStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWarehouseRequestDto } from './dto/create-warehouse-request.dto';
import { OperationDto } from './dto/operation.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { UpdateRequestItemsDto } from './dto/updated-request-items.dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async increaseItem(dto: OperationDto) {
    const candidate = await this.prisma.warehouseStock.findUnique({
      where: { productId: dto.id },
      include: { product: true },
    });

    if (!candidate) {
      throw new NotFoundException('Product not found!');
    }

    const newQuantity = candidate.quantity + dto.quantity;
    const newPackageCount =
      candidate.product.itemsPerPackage > 0
        ? Math.floor(newQuantity / candidate.product.itemsPerPackage)
        : 0;

    return await this.prisma.warehouseStock.update({
      where: { productId: dto.id },
      data: {
        quantity: newQuantity,
        packageCount: newPackageCount,
        product: {
          update: {
            isEnabled: newQuantity > 0,
          },
        },
      },
    });
  }

  async decreaseItem(dto: OperationDto) {
    const candidate = await this.prisma.warehouseStock.findUnique({
      where: { productId: dto.id },
      include: { product: true },
    });

    if (!candidate) {
      throw new NotFoundException('Product not found!');
    }

    if (candidate.quantity < dto.quantity) {
      throw new BadRequestException('Not enough item in stock');
    }

    const newQuantity = candidate.quantity - dto.quantity;
    const newPackageCount =
      candidate.product.itemsPerPackage > 0
        ? Math.floor(newQuantity / candidate.product.itemsPerPackage)
        : 0;

    return await this.prisma.warehouseStock.update({
      where: { productId: dto.id },
      data: {
        quantity: newQuantity,
        packageCount: newPackageCount,
        product: {
          update: {
            isEnabled: newQuantity > 0,
          },
        },
      },
    });
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

    const groupedItems = new Map<
      AdminScope,
      { productId: string; quantity: number; packageType: any }[]
    >();

    for (const item of dto.items) {
      const product = products.find(p => p.id === item.productId);
      if (!groupedItems.has(product.tag)) {
        groupedItems.set(product.tag, []);
      }
      groupedItems.get(product.tag).push(item as any);
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
                packageType: i.packageType,
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
      include: { items: { include: { product: true } } },
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
          const actualPiecesToAdd =
            item.packageType &&
            item.packageType !== 'PIECE' &&
            item.product.itemsPerPackage > 0
              ? item.quantity * item.product.itemsPerPackage
              : item.quantity;

          const currentStock = await tx.warehouseStock.findUnique({
            where: { productId: item.productId },
          });

          const currentQty = currentStock?.quantity || 0;
          const newTotalQuantity = currentQty + actualPiecesToAdd;

          const newPackageCount =
            item.product.itemsPerPackage > 0
              ? Math.floor(newTotalQuantity / item.product.itemsPerPackage)
              : 0;

          await tx.warehouseStock.upsert({
            where: { productId: item.productId },
            create: {
              productId: item.productId,
              quantity: newTotalQuantity,
              packageCount: newPackageCount,
            },
            update: {
              quantity: newTotalQuantity,
              packageCount: newPackageCount,
            },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: {
              isEnabled: newTotalQuantity > 0,
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

  async updateRequestItems(id: string, dto: UpdateRequestItemsDto) {
    const request = await this.prisma.warehouseRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return this.prisma.warehouseRequest.update({
      where: { id },
      data: {
        items: {
          deleteMany: {},
          create: dto.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            packageType: item.packageType,
          })),
        },
      },
      include: {
        items: { include: { product: { include: { category: true } } } },
      },
    });
  }
}
