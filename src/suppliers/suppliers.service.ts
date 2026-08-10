import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Supplier } from '@prisma/client';
import { decryptNullable, encryptNullable } from '../common/encryption.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/createSupplier.dto';
import { UpdateSupplierDto } from './dto/updateSupplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  private decryptSupplier(supplier: Supplier) {
    return {
      ...supplier,
      name: decryptNullable(supplier.name),
      contactPerson: decryptNullable(supplier.contactPerson),
      email: decryptNullable(supplier.email),
      notes: decryptNullable(supplier.notes),
    };
  }

  async getAllSuppliers(adminId: string) {
    const suppliers = await this.prisma.supplier.findMany({
      where: { createdById: adminId },
    });
    return suppliers
      .map(supplier => this.decryptSupplier(supplier))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  private async assertNameAvailable(adminId: string, name: string, excludeId?: string) {
    const existing = await this.prisma.supplier.findMany({
      where: { createdById: adminId },
      select: { id: true, name: true },
    });
    const nameTaken = existing.some(
      supplier =>
        supplier.id !== excludeId && decryptNullable(supplier.name) === name,
    );
    if (nameTaken) {
      throw new ConflictException('Supplier already exists!');
    }
  }

  async createSupplier(adminId: string, dto: CreateSupplierDto) {
    await this.assertNameAvailable(adminId, dto.name);

    const created = await this.prisma.supplier.create({
      data: {
        name: encryptNullable(dto.name),
        contactPerson: encryptNullable(dto.contactPerson),
        email: encryptNullable(dto.email),
        notes: encryptNullable(dto.notes),
        createdById: adminId,
      },
    });
    return this.decryptSupplier(created);
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
      await this.assertNameAvailable(adminId, dto.name, id);
    }

    const updated = await this.prisma.supplier.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: encryptNullable(dto.name) }),
        ...(dto.contactPerson !== undefined && {
          contactPerson: encryptNullable(dto.contactPerson),
        }),
        ...(dto.email !== undefined && { email: encryptNullable(dto.email) }),
        ...(dto.notes !== undefined && { notes: encryptNullable(dto.notes) }),
      },
    });
    return this.decryptSupplier(updated);
  }

  async deleteSupplier(adminId: string, id: string) {
    await this.findOwnedSupplier(adminId, id);
    return await this.prisma.supplier.delete({ where: { id } });
  }
}
