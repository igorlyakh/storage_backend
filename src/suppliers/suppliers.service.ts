import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/createSupplier.dto';
import { UpdateSupplierDto } from './dto/updateSupplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSuppliers(adminId: string) {
    return await this.prisma.supplier.findMany({
      where: { createdById: adminId },
      orderBy: { name: 'asc' },
    });
  }

  async createSupplier(adminId: string, dto: CreateSupplierDto) {
    const candidate = await this.prisma.supplier.findUnique({
      where: { createdById_name: { createdById: adminId, name: dto.name } },
    });
    if (candidate) {
      throw new ConflictException('Supplier already exists!');
    }
    return await this.prisma.supplier.create({
      data: { ...dto, createdById: adminId },
    });
  }

  private async findOwnedSupplier(adminId: string, id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier || supplier.createdById !== adminId) {
      throw new NotFoundException('Supplier not found!');
    }
    return supplier;
  }

  async updateSupplier(adminId: string, id: string, dto: UpdateSupplierDto) {
    await this.findOwnedSupplier(adminId, id);

    if (dto.name) {
      const candidate = await this.prisma.supplier.findUnique({
        where: { createdById_name: { createdById: adminId, name: dto.name } },
      });
      if (candidate && candidate.id !== id) {
        throw new ConflictException('Supplier already exists!');
      }
    }

    return await this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSupplier(adminId: string, id: string) {
    await this.findOwnedSupplier(adminId, id);
    return await this.prisma.supplier.delete({ where: { id } });
  }
}
