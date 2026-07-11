import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminScope, Role, WarehouseRequestStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { WarehousesService } from 'src/warehouses/warehouses.service';
import { CreateWarehouseRequestDto } from './dto/create-warehouse-request.dto';
import { OperationDto } from './dto/operation.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { UpdateRequestItemsDto } from './dto/updated-request-items.dto';

@Injectable()
export class WarehouseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly warehousesService: WarehousesService,
  ) {}

  private async resolveWarehouse(warehouseId?: string) {
    if (!warehouseId) {
      return await this.warehousesService.getDefaultWarehouse();
    }
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found!');
    }
    return warehouse;
  }

  async increaseItem(dto: OperationDto) {
    const warehouse = await this.resolveWarehouse(dto.warehouseId);

    const product = await this.prisma.product.findUnique({
      where: { id: dto.id },
    });

    if (!product) {
      throw new NotFoundException('Product not found!');
    }

    const stockKey = {
      productId_warehouseId: { productId: dto.id, warehouseId: warehouse.id },
    };

    const existing = await this.prisma.warehouseStock.findUnique({
      where: stockKey,
    });

    const newQuantity = (existing?.quantity ?? 0) + dto.quantity;
    const newPackageCount =
      product.itemsPerPackage > 0
        ? Math.floor(newQuantity / product.itemsPerPackage)
        : 0;

    const stock = await this.prisma.warehouseStock.upsert({
      where: stockKey,
      create: {
        productId: dto.id,
        warehouseId: warehouse.id,
        quantity: newQuantity,
        packageCount: newPackageCount,
      },
      update: {
        quantity: newQuantity,
        packageCount: newPackageCount,
      },
    });

    if (warehouse.isDefault) {
      await this.prisma.product.update({
        where: { id: dto.id },
        data: { isEnabled: newQuantity > 0 },
      });
    }

    return stock;
  }

  async decreaseItem(dto: OperationDto) {
    const warehouse = await this.resolveWarehouse(dto.warehouseId);

    const candidate = await this.prisma.warehouseStock.findUnique({
      where: {
        productId_warehouseId: { productId: dto.id, warehouseId: warehouse.id },
      },
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

    const stock = await this.prisma.warehouseStock.update({
      where: {
        productId_warehouseId: { productId: dto.id, warehouseId: warehouse.id },
      },
      data: {
        quantity: newQuantity,
        packageCount: newPackageCount,
      },
    });

    if (warehouse.isDefault) {
      await this.prisma.product.update({
        where: { id: dto.id },
        data: { isEnabled: newQuantity > 0 },
      });
    }

    return stock;
  }

  async setItemQuantity(dto: OperationDto) {
    const warehouse = await this.resolveWarehouse(dto.warehouseId);

    const product = await this.prisma.product.findUnique({
      where: { id: dto.id },
    });

    if (!product) {
      throw new NotFoundException('Product not found!');
    }

    if (dto.quantity < 0) {
      throw new BadRequestException('Quantity cannot be negative');
    }

    const newPackageCount =
      product.itemsPerPackage > 0
        ? Math.floor(dto.quantity / product.itemsPerPackage)
        : 0;

    const stockKey = {
      productId_warehouseId: { productId: dto.id, warehouseId: warehouse.id },
    };

    const stock = await this.prisma.warehouseStock.upsert({
      where: stockKey,
      create: {
        productId: dto.id,
        warehouseId: warehouse.id,
        quantity: dto.quantity,
        packageCount: newPackageCount,
      },
      update: {
        quantity: dto.quantity,
        packageCount: newPackageCount,
      },
    });

    if (warehouse.isDefault) {
      await this.prisma.product.update({
        where: { id: dto.id },
        data: { isEnabled: dto.quantity > 0 },
      });
    }

    return stock;
  }

  async createRequest(userId: string, dto: CreateWarehouseRequestDto) {
    let sourceWarehouseId: string | null = null;
    if (dto.sourceWarehouseId) {
      const source = await this.prisma.warehouse.findUnique({
        where: { id: dto.sourceWarehouseId },
      });
      if (!source) {
        throw new NotFoundException('Warehouse not found!');
      }
      if (source.isDefault) {
        throw new BadRequestException(
          'Source warehouse cannot be the main warehouse',
        );
      }
      sourceWarehouseId = source.id;
    }

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
            sourceWarehouseId,
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

  async getAdminRequests(
    adminScopes: AdminScope[],
    filters?: {
      statuses?: WarehouseRequestStatus[];
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: any = {
      category: { in: adminScopes },
    };

    if (filters?.statuses?.length) {
      where.status = { in: filters.statuses };
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        where.createdAt.gte = start;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    return this.prisma.warehouseRequest.findMany({
      where,
      include: {
        items: { include: { product: { include: { category: true } } } },
        sourceWarehouse: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
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

      const defaultWarehouse = await this.warehousesService.getDefaultWarehouse();

      return this.prisma.$transaction(async tx => {
        for (const item of request.items) {
          const actualPiecesToAdd =
            item.packageType &&
            item.packageType !== 'PIECE' &&
            item.product.itemsPerPackage > 0
              ? item.quantity * item.product.itemsPerPackage
              : item.quantity;

          if (request.sourceWarehouseId) {
            const sourceStock = await tx.warehouseStock.findUnique({
              where: {
                productId_warehouseId: {
                  productId: item.productId,
                  warehouseId: request.sourceWarehouseId,
                },
              },
            });

            if (!sourceStock || sourceStock.quantity < actualPiecesToAdd) {
              throw new BadRequestException(
                `Not enough stock for ${item.product.name}!`,
              );
            }

            const newSourceQuantity = sourceStock.quantity - actualPiecesToAdd;
            const newSourcePackageCount =
              item.product.itemsPerPackage > 0
                ? Math.floor(newSourceQuantity / item.product.itemsPerPackage)
                : 0;

            await tx.warehouseStock.update({
              where: {
                productId_warehouseId: {
                  productId: item.productId,
                  warehouseId: request.sourceWarehouseId,
                },
              },
              data: {
                quantity: newSourceQuantity,
                packageCount: newSourcePackageCount,
              },
            });
          }

          const currentStock = await tx.warehouseStock.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: defaultWarehouse.id,
              },
            },
          });

          const currentQty = currentStock?.quantity || 0;
          const newTotalQuantity = currentQty + actualPiecesToAdd;

          const newPackageCount =
            item.product.itemsPerPackage > 0
              ? Math.floor(newTotalQuantity / item.product.itemsPerPackage)
              : 0;

          await tx.warehouseStock.upsert({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: defaultWarehouse.id,
              },
            },
            create: {
              productId: item.productId,
              warehouseId: defaultWarehouse.id,
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

  async getWarehouseRequests(filters?: {
    statuses?: WarehouseRequestStatus[];
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters?.statuses?.length) {
      where.status = { in: filters.statuses };
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        where.createdAt.gte = start;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    return this.prisma.warehouseRequest.findMany({
      where,
      include: {
        items: {
          include: { product: { include: { category: true } } },
        },
        creator: {
          select: { username: true },
        },
        sourceWarehouse: { select: { id: true, name: true } },
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
        sourceWarehouse: { select: { id: true, name: true } },
      },
    });
  }

  async deleteRequest(id: string) {
    const request = await this.prisma.warehouseRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return this.prisma.$transaction(async tx => {
      await tx.warehouseRequestItem.deleteMany({ where: { requestId: id } });
      return tx.warehouseRequest.delete({ where: { id } });
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
        sourceWarehouse: { select: { id: true, name: true } },
      },
    });
  }
}
