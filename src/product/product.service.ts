import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { StoresService } from 'src/stores/stores.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeService: StoresService,
  ) {}

  async createProduct(dto: CreateProductDto) {
    const candidate = await this.prisma.product.findUnique({
      where: { name: dto.name },
    });

    if (candidate) {
      throw new ConflictException('Product already exists!');
    }

    const { initialQuantity, initialPackagesCount, brandsIds, ...productData } = dto;

    const itemsPerPkg = productData.itemsPerPackage || 0;
    const initialPkgs = initialPackagesCount || 0;

    const calculatedQuantity =
      itemsPerPkg > 0 ? initialPkgs * itemsPerPkg : (initialQuantity ?? 0);

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        stock: {
          create: {
            quantity: calculatedQuantity,
            packageCount: initialPkgs,
          },
        },
        category: {
          connect: { id: productData.category },
        },
        brands: {
          connect: brandsIds.map(id => ({ id })),
        },
      },
      include: {
        stock: true,
        brands: true,
        category: true,
      },
    });

    return product;
  }

  async getAllProducts(user: User) {
    let whereCondition = {};
    if (user.role === Role.ADMIN) {
      whereCondition = {
        tag: {
          in: user.adminScopes,
        },
      };
    }
    return await this.prisma.product.findMany({
      where: whereCondition,
      include: { stock: true, brands: true, category: true },
      orderBy: { name: 'desc' },
    });
  }

  async getAllProductsByBrands(storeId: number) {
    const store = await this.storeService.getStoreById(storeId);
    const brandsIds = store.brands.map(brand => brand.id);

    return await this.prisma.product.findMany({
      where: {
        brands: {
          some: {
            id: {
              in: brandsIds,
            },
          },
        },
      },
      include: { stock: true, brands: true, category: true },
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

    const { brandIds, category, ...restData } = dto;

    const updateData: any = { ...restData };

    if (brandIds !== undefined) {
      updateData.brands = {
        set: brandIds.map(brandId => ({ id: brandId })),
      };
    }

    if (category !== undefined && category !== null) {
      const categoryId = typeof category === 'object' ? category.id : category;

      updateData.category = {
        connect: { id: categoryId },
      };
    }

    return await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        stock: true,
        brands: true,
      },
    });
  }
}
