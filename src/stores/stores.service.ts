import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStoreDto } from './dto/createStore.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findStoreByName(name: string) {
    const store = await this.prisma.store.findUnique({ where: { name } });
    return store;
  }

  async createStore(dto: CreateStoreDto) {
    const candidate = await this.findStoreByName(dto.name);
    if (candidate) {
      throw new ConflictException('A store with this name already exists!');
    }
    const store = await this.prisma.store.create({ data: { ...dto } });
    return store;
  }

  async deleteStoreByName(name: string) {
    const store = await this.findStoreByName(name);
    if (!store) {
      throw new NotFoundException(`Store ${name} not found!`);
    }
    return await this.prisma.store.delete({ where: { name: store.name } });
  }

  async getAllStores() {
    return await this.prisma.store.findMany();
  }
}
