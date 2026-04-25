import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(dto: CreateProductDto) {
    const candidate = await this.prisma.product.findUnique({ where: { name: dto.name } });
    if (candidate) {
      throw new ConflictException('Product already exists!');
    }
    const { initialQuantity, ...productData } = dto;
    const product = await this.prisma.product.create({
      data: {
        ...productData,
        stock: {
          create: {
            quantity: initialQuantity ?? 0,
          },
        },
        brands: {
          connect: dto.brandIds.map(id => ({ id })),
        },
      },
      include: {
        stock: true,
      },
    });
    return product;
  }

  async getAllProducts() {
    return await this.prisma.product.findMany({
      include: { stock: true },
      orderBy: { name: 'desc' },
    });
  }

  async getAllProductsByBrands(brandIds: string[]) {
    return await this.prisma.product.findMany({
      where: {
        brands: {
          some: {
            id: {
              in: brandIds,
            },
          },
        },
      },
      include: { stock: true },
      orderBy: { name: 'desc' },
    });
  }

  async findProductByName(name: string) {
    return await this.prisma.product.findUnique({ where: { name } });
  }

  async deleteById(id: string) {
    return await this.prisma.product.delete({ where: { id } });
  }

  async updateProductById(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found!');
    }

    return await this.prisma.product.update({
      where: { id },
      data: { ...dto },
      include: { stock: true },
    });
  }
}
