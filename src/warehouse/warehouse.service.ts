import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OperationDto } from './dto/operation.dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async increaseItem(dto: OperationDto) {
    const candidate = await this.prisma.warehouseStock.findUnique({
      where: { productId: dto.productId },
    });

    if (!candidate) {
      throw new NotFoundException('Product not found!');
    }

    const result = await this.prisma.warehouseStock.update({
      where: { productId: dto.productId },
      data: {
        quantity: {
          increment: dto.quantity,
        },
      },
    });

    return result;
  }

  async decreaseItem(dto: OperationDto) {
    const candidate = await this.prisma.warehouseStock.findUnique({
      where: { productId: dto.productId },
    });

    if (!candidate) {
      throw new NotFoundException('Product not found!');
    }

    const result = await this.prisma.warehouseStock.update({
      where: { productId: dto.productId },
      data: {
        quantity: {
          decrement: dto.quantity,
        },
      },
    });

    return result;
  }
}
