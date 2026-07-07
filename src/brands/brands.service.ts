import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBrandDto } from './dto/CreateBrand.dto';
import { UpdateBrandDto } from './dto/UpdateBrand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllBrands() {
    return await this.prisma.brand.findMany();
  }

  async getBrandByName(name: string) {
    return await this.prisma.brand.findUnique({ where: { name } });
  }

  async createBrand(dto: CreateBrandDto) {
    const candidate = await this.prisma.brand.findUnique({ where: { name: dto.name } });
    if (candidate) {
      throw new ConflictException('Brand already exists');
    }
    return await this.prisma.brand.create({ data: dto });
  }

  async deleteBrand(name: string) {
    const brand = await this.prisma.brand.findUnique({ where: { name } });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return await this.prisma.brand.delete({ where: { name } });
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    if (dto.name !== brand.name) {
      const candidate = await this.prisma.brand.findUnique({
        where: { name: dto.name },
      });
      if (candidate) {
        throw new ConflictException('Brand already exists');
      }
    }
    return await this.prisma.brand.update({ where: { id }, data: { name: dto.name } });
  }
}
