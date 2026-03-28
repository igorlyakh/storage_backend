import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/createOrder.dto';
import { SendOrderDto } from './dto/sendOrder.dto';

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

  async getAllOrdersByStoreId(storeId: number, page: number = 1) {
    const LIMIT = 9;
    const skip = (page - 1) * LIMIT;
    const [orders, totalCount] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          storeId,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          store: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: LIMIT,
      }),
      this.prisma.order.count({ where: { storeId } }),
    ]);
    return {
      data: orders,
      meta: {
        total: totalCount,
        page,
        limit: LIMIT,
        lastPage: Math.ceil(totalCount / LIMIT),
      },
    };
  }

  async getAllOrders(
    page: number = 1,
    filters?: { storeId?: string; status?: string; dateFrom?: Date; dateTo?: Date },
  ) {
    const LIMIT = 9;
    const skip = (page - 1) * LIMIT;

    const statusFilter = filters?.status || 'NEW';

    const where: any = {
      status: statusFilter,
    };

    if (filters?.storeId) {
      where.storeId = filters.storeId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      };
    }

    const [orders, totalCount] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: { include: { product: true } },
          store: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: LIMIT,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total: totalCount,
        page,
        limit: LIMIT,
        lastPage: Math.ceil(totalCount / LIMIT),
      },
    };
  }

  async startProcessing(orderId: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'IN_PROGRESS' },
      include: { items: true },
    });
  }

  async sendOrder(dto: SendOrderDto) {
    return await this.prisma.$transaction(async tx => {
      const order = await tx.order.findUnique({
        where: { id: dto.orderId },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Order not found!');
      if (order.status === 'COMPLETED')
        throw new BadRequestException('Order is already completed!');

      const sendedMap = new Map<string, number>();
      if (dto.items) {
        dto.items.forEach(item => sendedMap.set(item.productId, item.quantity));
      }

      for (const item of order.items) {
        const actualQty = sendedMap.has(item.productId)
          ? sendedMap.get(item.productId)
          : item.requestedQty;

        await tx.warehouseStock.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: actualQty } },
        });

        await tx.orderItem.update({
          where: {
            id: item.id,
          },
          data: {
            shippedQty: actualQty,
          },
        });
      }

      return await tx.order.update({
        where: { id: dto.orderId },
        data: { status: 'COMPLETED' },
      });
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, store: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found!');
    }
    return order;
  }
}
