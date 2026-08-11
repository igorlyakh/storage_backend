import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ReturnStatus, Role, User } from '@prisma/client';
import { promises as fs } from 'fs';
import { join } from 'path';
import { buildCreatedAtRangeFilter } from '../common/date-range.util';
import { calculatePackageCount } from '../common/stock.util';
import { RETURN_PHOTOS_DIR } from '../config/uploads';
import { syncSubstitute } from '../product/substitute.util';
import { PrismaService } from '../prisma/prisma.service';
import { WarehousesService } from '../warehouses/warehouses.service';
import { CreateReturnDto } from './dto/createReturn.dto';

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const returnInclude = {
  items: { include: { product: true } },
  store: true,
  creator: { select: { id: true, username: true } },
  approvedBy: { select: { id: true, username: true } },
  pickedUpBy: { select: { id: true, username: true } },
  closedBy: { select: { id: true, username: true } },
};

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly warehousesService: WarehousesService,
  ) {}

  async uploadPhoto(file: Express.Multer.File) {
    await fs.mkdir(RETURN_PHOTOS_DIR, { recursive: true });

    const ext = IMAGE_EXTENSIONS[file.mimetype] ?? '.jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    await fs.writeFile(join(RETURN_PHOTOS_DIR, filename), file.buffer);

    return { url: `/uploads/returns/${filename}` };
  }

  async createReturn(user: User, dto: CreateReturnDto) {
    if (!user.storeId) {
      throw new BadRequestException('User is not assigned to a store');
    }

    for (const item of dto.items) {
      const hasProduct = Boolean(item.productId);
      const hasCustomName = Boolean(item.customName);
      if (hasProduct === hasCustomName) {
        throw new BadRequestException(
          'Each item must have either a productId or a customName, not both',
        );
      }
    }

    const productIds = dto.items.map(item => item.productId).filter(Boolean);
    if (productIds.length) {
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true },
      });

      if (products.length !== new Set(productIds).size) {
        throw new BadRequestException('Products not found');
      }
    }

    return this.prisma.return.create({
      data: {
        storeId: user.storeId,
        createdById: user.id,
        items: {
          create: dto.items.map(item => ({
            productId: item.productId || null,
            customName: item.customName || null,
            quantity: item.quantity,
            photoUrl: item.photoUrl,
          })),
        },
      },
      include: returnInclude,
    });
  }

  async getMyReturns(storeId: number, statuses?: ReturnStatus[]) {
    const where: any = { storeId };
    if (statuses?.length) {
      where.status = { in: statuses };
    }

    return this.prisma.return.findMany({
      where,
      include: returnInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllReturns(filters?: {
    statuses?: ReturnStatus[];
    storeIds?: number[];
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters?.statuses?.length) {
      where.status = { in: filters.statuses };
    }
    if (filters?.storeIds?.length) {
      where.storeId = { in: filters.storeIds };
    }

    const createdAtRange = buildCreatedAtRangeFilter(filters?.startDate, filters?.endDate);
    if (createdAtRange) {
      where.createdAt = createdAtRange;
    }

    return this.prisma.return.findMany({
      where,
      include: returnInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDriverReturns() {
    return this.prisma.return.findMany({
      where: { status: ReturnStatus.APPROVED },
      include: returnInclude,
      orderBy: { approvedAt: 'asc' },
    });
  }

  async getWarehouseReturns() {
    return this.prisma.return.findMany({
      where: { status: ReturnStatus.IN_TRANSIT },
      include: returnInclude,
      orderBy: { pickedUpAt: 'asc' },
    });
  }

  async getReturnById(id: string, user: User) {
    const returnRecord = await this.prisma.return.findUnique({
      where: { id },
      include: returnInclude,
    });

    if (!returnRecord) {
      throw new NotFoundException('Return not found!');
    }

    if (user.role === Role.STORE && returnRecord.storeId !== user.storeId) {
      throw new NotFoundException('Return not found!');
    }

    return returnRecord;
  }

  private async findReturnOrThrow(id: string) {
    const returnRecord = await this.prisma.return.findUnique({ where: { id } });
    if (!returnRecord) {
      throw new NotFoundException('Return not found!');
    }
    return returnRecord;
  }

  async approveReturn(id: string, adminId: string) {
    const returnRecord = await this.findReturnOrThrow(id);

    if (returnRecord.status !== ReturnStatus.PENDING) {
      throw new BadRequestException('Only pending returns can be approved');
    }

    return this.prisma.return.update({
      where: { id },
      data: {
        status: ReturnStatus.APPROVED,
        approvedById: adminId,
        approvedAt: new Date(),
      },
      include: returnInclude,
    });
  }

  async rejectReturn(id: string, adminId: string, reason: string) {
    const returnRecord = await this.findReturnOrThrow(id);

    if (returnRecord.status !== ReturnStatus.PENDING) {
      throw new BadRequestException('Only pending returns can be rejected');
    }

    return this.prisma.return.update({
      where: { id },
      data: {
        status: ReturnStatus.REJECTED,
        approvedById: adminId,
        rejectionReason: reason,
      },
      include: returnInclude,
    });
  }

  async pickupReturn(id: string, driverId: string) {
    const returnRecord = await this.findReturnOrThrow(id);

    if (returnRecord.status !== ReturnStatus.APPROVED) {
      throw new BadRequestException('Only approved returns can be picked up');
    }

    return this.prisma.return.update({
      where: { id },
      data: {
        status: ReturnStatus.IN_TRANSIT,
        pickedUpById: driverId,
        pickedUpAt: new Date(),
      },
      include: returnInclude,
    });
  }

  async closeReturn(id: string, warehouseUserId: string) {
    const returnRecord = await this.prisma.return.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!returnRecord) {
      throw new NotFoundException('Return not found!');
    }

    if (returnRecord.status !== ReturnStatus.IN_TRANSIT) {
      throw new BadRequestException('Only in-transit returns can be closed');
    }

    const defaultWarehouse = await this.warehousesService.getDefaultWarehouse();

    return this.prisma.$transaction(async tx => {
      for (const item of returnRecord.items) {
        if (!item.productId || !item.product) continue;

        const stockKey = {
          productId_warehouseId: {
            productId: item.productId,
            warehouseId: defaultWarehouse.id,
          },
        };

        const currentStock = await tx.warehouseStock.findUnique({ where: stockKey });
        const newQuantity = (currentStock?.quantity ?? 0) + item.quantity;
        const newPackageCount = calculatePackageCount(
          newQuantity,
          item.product.itemsPerPackage,
        );

        await tx.warehouseStock.upsert({
          where: stockKey,
          create: {
            productId: item.productId,
            warehouseId: defaultWarehouse.id,
            quantity: newQuantity,
            packageCount: newPackageCount,
          },
          update: {
            quantity: newQuantity,
            packageCount: newPackageCount,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { isEnabled: newQuantity > 0 },
        });

        await syncSubstitute(tx, item.productId, newQuantity > 0);
      }

      return tx.return.update({
        where: { id },
        data: {
          status: ReturnStatus.COMPLETED,
          closedById: warehouseUserId,
          closedAt: new Date(),
        },
        include: returnInclude,
      });
    });
  }
}
