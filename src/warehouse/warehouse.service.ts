import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OperationDto } from './dto/operation.dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async increaseItem(dto: OperationDto) {
    const candidate = await this.prisma.warehouseStock.findUnique({
      where: { productId: dto.id },
    });

    if (!candidate) {
      throw new NotFoundException('Product not found!');
    }

    const result = await this.prisma.warehouseStock.update({
      where: { productId: dto.id },
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
      where: { productId: dto.id },
    });

    if (!candidate) {
      throw new NotFoundException('Product not found!');
    }

    if (candidate.quantity < dto.quantity) {
      throw new BadRequestException('Not enough item in stock');
    }

    const result = await this.prisma.warehouseStock.update({
      where: { productId: dto.id },
      data: {
        quantity: {
          decrement: dto.quantity,
        },
      },
    });

    return result;
  }
}
