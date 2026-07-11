import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { promises as fs } from 'fs';
import { basename, join } from 'path';
import { PRODUCT_IMAGES_DIR } from 'src/config/uploads';
import { PrismaService } from 'src/prisma/prisma.service';
import { StoresService } from 'src/stores/stores.service';
import { WarehousesService } from 'src/warehouses/warehouses.service';
import { CreateProductDto } from './dto/createProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeService: StoresService,
    private readonly warehousesService: WarehousesService,
  ) {}

  private readonly productInclude = {
    stocks: {
      include: {
        warehouse: { select: { id: true, name: true, isDefault: true } },
      },
    },
    brands: true,
    category: true,
  };

  private withStockSummary<
    T extends { stocks: { quantity: number; packageCount: number; warehouse: { isDefault: boolean } }[] },
  >(product: T) {
    const defaultStock = product.stocks.find(s => s.warehouse.isDefault) ?? null;
    const totalQuantity = product.stocks.reduce((sum, s) => sum + s.quantity, 0);
    return {
      ...product,
      stock: defaultStock ?? { quantity: 0, packageCount: 0 },
      totalQuantity,
    };
  }

  async createProduct(dto: CreateProductDto) {
    const candidate = await this.prisma.product.findUnique({
      where: { name: dto.name },
    });

    if (candidate) {
      throw new ConflictException('Product already exists!');
    }

    const { initialQuantity, initialPackagesCount, brandsIds, warehouseId, ...productData } =
      dto;

    const itemsPerPkg = productData.itemsPerPackage || 0;
    const initialPkgs = initialPackagesCount || 0;

    const calculatedQuantity =
      itemsPerPkg > 0 ? initialPkgs * itemsPerPkg : (initialQuantity ?? 0);

    const defaultWarehouse = await this.warehousesService.getDefaultWarehouse();

    let targetWarehouse = defaultWarehouse;
    if (warehouseId && warehouseId !== defaultWarehouse.id) {
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: warehouseId },
      });
      if (!warehouse) {
        throw new NotFoundException('Warehouse not found!');
      }
      targetWarehouse = warehouse;
    }

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        isEnabled: targetWarehouse.isDefault && calculatedQuantity > 0,
        stocks: {
          create: {
            quantity: calculatedQuantity,
            packageCount: initialPkgs,
            warehouse: { connect: { id: targetWarehouse.id } },
          },
        },
        category: {
          connect: { id: productData.category },
        },
        brands: {
          connect: brandsIds.map(id => ({ id })),
        },
      },
      include: this.productInclude,
    });

    return this.withStockSummary(product);
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
    const products = await this.prisma.product.findMany({
      where: whereCondition,
      include: this.productInclude,
      orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }],
    });
    return products.map(p => this.withStockSummary(p));
  }

  async getAllProductsByBrands(storeId: number) {
    const store = await this.storeService.getStoreById(storeId);

    if (!store?.brandId) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: {
        brands: {
          some: {
            id: store.brandId,
          },
        },
      },
      include: this.productInclude,
      orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }],
    });
    return products.map(p => this.withStockSummary(p));
  }

  async reorderProducts(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.product.update({ where: { id }, data: { order: index } }),
      ),
    );
    return { success: true };
  }

  async getLowStockProducts(user: User, threshold: number) {
    const whereCondition: any = {
      stocks: {
        some: {
          quantity: { lte: threshold },
          warehouse: { isDefault: true },
        },
      },
    };
    if (user.role === Role.ADMIN) {
      whereCondition.tag = { in: user.adminScopes };
    }
    const products = await this.prisma.product.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        article: true,
        stocks: {
          where: { warehouse: { isDefault: true } },
          select: { quantity: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return products.map(({ stocks, ...product }) => ({
      ...product,
      stock: stocks[0] ?? { quantity: 0 },
    }));
  }

  async getMonthlyOrderedQuantity(productId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.prisma.orderItem.aggregate({
      where: {
        productId,
        order: { createdAt: { gte: startOfMonth } },
      },
      _sum: { requestedQty: true, shippedQty: true },
    });

    return {
      requested: result._sum.requestedQty ?? 0,
      shipped: result._sum.shippedQty ?? 0,
    };
  }

  async findProductByName(name: string) {
    return await this.prisma.product.findUnique({ where: { name } });
  }

  async deleteById(id: string) {
    const product = await this.prisma.product.delete({ where: { id } });
    if (product.imageUrl) {
      await this.removeImageFile(product.imageUrl);
    }
    return product;
  }

  async updateProductById(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { stocks: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found!');
    }

    const { brandIds, category, itemsPerPackage, ...restData } = dto;

    const updateData: any = { ...restData };

    if (itemsPerPackage !== undefined) {
      updateData.itemsPerPackage = itemsPerPackage;
    }

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

    const updated = await this.prisma.$transaction(async tx => {
      await tx.product.update({
        where: { id },
        data: updateData,
      });

      if (itemsPerPackage !== undefined) {
        for (const stock of product.stocks) {
          const newPackageCount =
            itemsPerPackage > 0 ? Math.floor(stock.quantity / itemsPerPackage) : 0;
          await tx.warehouseStock.update({
            where: { id: stock.id },
            data: { packageCount: newPackageCount },
          });
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: this.productInclude,
      });
    });

    return this.withStockSummary(updated);
  }

  async setProductImage(id: string, file: Express.Multer.File) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found!');
    }

    await fs.mkdir(PRODUCT_IMAGES_DIR, { recursive: true });

    const ext = IMAGE_EXTENSIONS[file.mimetype] ?? '.jpg';
    const filename = `${id}-${Date.now()}${ext}`;
    await fs.writeFile(join(PRODUCT_IMAGES_DIR, filename), file.buffer);

    if (product.imageUrl) {
      await this.removeImageFile(product.imageUrl);
    }

    return await this.prisma.product.update({
      where: { id },
      data: { imageUrl: `/uploads/products/${filename}` },
    });
  }

  async removeProductImage(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found!');
    }

    if (product.imageUrl) {
      await this.removeImageFile(product.imageUrl);
    }

    return await this.prisma.product.update({
      where: { id },
      data: { imageUrl: null },
    });
  }

  private async removeImageFile(imageUrl: string) {
    try {
      await fs.unlink(join(PRODUCT_IMAGES_DIR, basename(imageUrl)));
    } catch {}
  }
}
