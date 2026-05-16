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
          customRequest: dto.customRequest,
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

  async getAllOrdersByStoreId(
    storeId: number,
    page: number = 1,
    filters?: { statuses?: string[]; date?: string },
  ) {
    const LIMIT = 12;
    const skip = (page - 1) * LIMIT;

    const statusesFilter = filters?.statuses?.length
      ? filters.statuses
      : ['NEW', 'IN_PROGRESS'];

    const where: any = {
      storeId,
      status: { in: statusesFilter },
    };

    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const [orders, totalCount] = await Promise.all([
      this.prisma.order.findMany({
        where,
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

  async getAllOrders(
    page: number = 1,
    filters?: {
      storeIds?: number[];
      statuses?: string[];
      startDate?: string;
      endDate?: string;
    },
  ) {
    const LIMIT = 12;
    const skip = (page - 1) * LIMIT;

    const statusesFilter = filters?.statuses?.length
      ? filters.statuses
      : ['NEW', 'IN_PROGRESS'];

    const where: any = {
      status: { in: statusesFilter },
    };

    if (filters?.storeIds?.length) {
      where.storeId = { in: filters.storeIds };
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};

      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        where.createdAt.gte = start;
      }

      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
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

      if (order.status !== 'IN_PROGRESS') {
        throw new BadRequestException(
          `Order cannot be sent! Current status is ${order.status}, expected IN_PROGRESS.`,
        );
      }

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
          where: { id: item.id },
          data: { shippedQty: actualQty },
        });
      }

      return await tx.order.update({
        where: { id: dto.orderId },
        data: { status: 'SENT' },
      });
    });
  }

  async completeOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found!');

    if (order.status !== 'SENT') {
      throw new BadRequestException(
        `Order cannot be completed! Current status is ${order.status}, expected SENT.`,
      );
    }

    return await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
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
