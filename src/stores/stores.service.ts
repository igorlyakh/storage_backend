import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStoreDto } from './dto/createStore.dto';
import { UpdateStoreDto } from './dto/updateStore.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findStoreByName(name: string) {
    const store = await this.prisma.store.findUnique({
      where: { name },
      include: { brand: true },
    });
    return store;
  }

  async createStore(dto: CreateStoreDto) {
    const candidate = await this.findStoreByName(dto.name);
    if (candidate) {
      throw new ConflictException('A store with this name already exists!');
    }
    const store = await this.prisma.store.create({
      data: {
        name: dto.name,
        brand: {
          connect: { id: dto.brandId },
        },
      },
    });
    return store;
  }

  async updateStore(id: number, dto: UpdateStoreDto) {
    const store = await this.getStoreById(id);
    if (!store) {
      throw new NotFoundException(`Store with id ${id} not found!`);
    }

    if (dto.name && dto.name !== store.name) {
      const candidate = await this.findStoreByName(dto.name);
      if (candidate) {
        throw new ConflictException('A store with this name already exists!');
      }
    }

    return await this.prisma.store.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.brandId && { brand: { connect: { id: dto.brandId } } }),
      },
      include: { brand: true },
    });
  }

  async deleteStoreById(id: number) {
    const store = await this.getStoreById(id);
    if (!store) {
      throw new NotFoundException(`Store with id ${id} not found!`);
    }
    return await this.prisma.store.delete({ where: { id } });
  }

  async getAllStores() {
    const stores = await this.prisma.store.findMany({
      include: {
        brand: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });
    return stores.map(({ orders, ...store }) => ({
      ...store,
      lastOrderAt: orders[0]?.createdAt ?? null,
    }));
  }

  async getStoreById(id: number) {
    return await this.prisma.store.findUnique({
      where: { id },
      include: { brand: true },
    });
  }
}
