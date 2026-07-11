import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/createCategoryDto';
import { UpdateCategoryDto } from './dto/updateCategoryDto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(dto: CreateCategoryDto) {
    const candidate = await this.prisma.categories.findUnique({
      where: { name: dto.name },
    });
    if (candidate) {
      throw new ConflictException('Category already exists!');
    }
    return await this.prisma.categories.create({ data: dto });
  }

  async getAllCategories() {
    return await this.prisma.categories.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.categories.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found!');
    }
    return await this.prisma.categories.delete({ where: { id } });
  }

  async reorderCategories(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.categories.update({ where: { id }, data: { order: index } }),
      ),
    );
    return await this.getAllCategories();
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.categories.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found!');
    }
    if (dto.name !== category.name) {
      const candidate = await this.prisma.categories.findUnique({
        where: { name: dto.name },
      });
      if (candidate) {
        throw new ConflictException('Category already exists!');
      }
    }
    return await this.prisma.categories.update({
      where: { id },
      data: { name: dto.name },
    });
  }
}
