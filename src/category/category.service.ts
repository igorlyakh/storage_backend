import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/createCategoryDto';

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
    return await this.prisma.categories.findMany();
  }
}
