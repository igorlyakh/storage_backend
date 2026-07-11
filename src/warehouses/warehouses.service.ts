import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWarehouseDto } from './dto/createWarehouse.dto';
import { UpdateWarehouseDto } from './dto/updateWarehouse.dto';

@Injectable()
export class WarehousesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.getDefaultWarehouse();
  }

  async getDefaultWarehouse() {
    const existing = await this.prisma.warehouse.findFirst({
      where: { isDefault: true },
    });
    if (existing) return existing;

    return await this.prisma.warehouse.create({
      data: { name: 'Main', isDefault: true },
    });
  }

  async getAllWarehouses() {
    return await this.prisma.warehouse.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getWarehouseStocks(id: string, user: User) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found!');
    }

    const whereCondition: any = {};
    if (user.role === Role.ADMIN) {
      whereCondition.tag = { in: user.adminScopes };
    }

    const products = await this.prisma.product.findMany({
      where: whereCondition,
      select: {
        id: true,
        article: true,
        name: true,
        imageUrl: true,
        packageType: true,
        itemsPerPackage: true,
        category: { select: { name: true } },
        stocks: {
          where: { warehouseId: id },
          select: { quantity: true, packageCount: true },
        },
      },
      orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }],
    });

    return {
      warehouse,
      products: products.map(({ stocks, ...product }) => ({
        ...product,
        quantity: stocks[0]?.quantity ?? 0,
        packageCount: stocks[0]?.packageCount ?? 0,
      })),
    };
  }

  async createWarehouse(dto: CreateWarehouseDto) {
    const candidate = await this.prisma.warehouse.findUnique({
      where: { name: dto.name },
    });
    if (candidate) {
      throw new ConflictException('Warehouse already exists!');
    }
    return await this.prisma.warehouse.create({ data: { name: dto.name } });
  }

  async updateWarehouse(id: string, dto: UpdateWarehouseDto) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found!');
    }
    if (dto.name !== warehouse.name) {
      const candidate = await this.prisma.warehouse.findUnique({
        where: { name: dto.name },
      });
      if (candidate) {
        throw new ConflictException('Warehouse already exists!');
      }
    }
    return await this.prisma.warehouse.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async deleteWarehouse(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found!');
    }
    if (warehouse.isDefault) {
      throw new BadRequestException('The main warehouse cannot be deleted');
    }
    return await this.prisma.warehouse.delete({ where: { id } });
  }
}
