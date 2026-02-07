import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/createOrder.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(storeId: number, dto: CreateOrderDto) {
    try {
      return await this.prisma.order.create({
        data: {
          storeId,
          items: {
            create: dto.items.map(item => ({
              requestedQty: item.quantity,
              product: {
                connect: {
                  name: item.name,
                },
              },
            })),
          },
        },
        include: {
          items: true,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new BadRequestException('Product not found!');
      }
    }
  }

  async getAllOrdersByStoreId(storeId: number) {
    return await this.prisma.order.findMany({ where: { storeId } });
  }

  async getAllOrders() {
    return await this.prisma.order.findMany();
  }
}
