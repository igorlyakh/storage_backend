import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/createOrder.dto';
import { SendOrderDto } from './dto/sendOrder.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(actor: { role: string; storeId: number | null }, dto: CreateOrderDto) {
    const isWriteOff = actor.role !== 'STORE';

    const storeId = isWriteOff ? dto.storeId : actor.storeId;

    if (!storeId) {
      throw new BadRequestException('Store is required to create an order.');
    }

    if (isWriteOff && !dto.customRequest) {
      throw new BadRequestException(
        'Reason is required when creating a write-off order.',
      );
    }

    const activeOrder = await this.prisma.order.findFirst({
      where: {
        storeId,
        status: { in: ['NEW', 'IN_PROGRESS', 'SENT'] },
      },
    });

    if (activeOrder) {
      throw new BadRequestException(
        'Your store already has an active order in processing. Please wait for its completion before creating a new one.',
      );
    }

    try {
      return await this.prisma.order.create({
        data: {
          storeId,
          name: dto.name,
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
      throw error;
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
      : ['NEW', 'IN_PROGRESS', 'BACKORDER'];

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
      : ['NEW', 'IN_PROGRESS', 'BACKORDER'];

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

      if (order.status !== 'IN_PROGRESS' && order.status !== 'BACKORDER') {
        throw new BadRequestException(
          `Order cannot be sent! Current status is ${order.status}.`,
        );
      }

      const itemsForBackorder = [];

      const frontendItemsMap = new Map<
        string,
        { quantity: number; isChecked: boolean }
      >();
      if (dto.items) {
        dto.items.forEach(item =>
          frontendItemsMap.set(item.productId, {
            quantity: item.quantity,
            isChecked: item.isChecked,
          }),
        );
      }

      for (const item of order.items) {
        const frontendData = frontendItemsMap.get(item.productId);
        const isChecked = frontendData ? frontendData.isChecked : false;
        const actualQty = frontendData ? frontendData.quantity : 0;

        if (isChecked) {
          const productInfo = await tx.product.findUnique({
            where: { id: item.productId },
            include: { stock: true },
          });

          if (!productInfo || !productInfo.stock) {
            throw new NotFoundException(
              `Stock for product ID ${item.productId} not found!`,
            );
          }

          const newQuantity = productInfo.stock.quantity - actualQty;

          if (newQuantity < 0) {
            throw new BadRequestException(`Not enough stock for ${productInfo.name}!`);
          }

          const newPackageCount =
            productInfo.itemsPerPackage > 0
              ? Math.floor(newQuantity / productInfo.itemsPerPackage)
              : 0;

          await tx.warehouseStock.update({
            where: { productId: item.productId },
            data: {
              quantity: newQuantity,
              packageCount: newPackageCount,
              product: {
                update: {
                  isEnabled: newQuantity > 0,
                },
              },
            },
          });

          await tx.orderItem.update({
            where: { id: item.id },
            data: { shippedQty: actualQty },
          });
        } else {
          await tx.orderItem.update({
            where: { id: item.id },
            data: { shippedQty: 0 },
          });

          itemsForBackorder.push({
            productId: item.productId,
            requestedQty: item.requestedQty,
          });
        }
      }

      if (itemsForBackorder.length > 0) {
        await tx.order.create({
          data: {
            storeId: order.storeId,
            name: `${order.name} (Backorder)`,
            customRequest: order.customRequest,
            status: 'BACKORDER',
            items: {
              create: itemsForBackorder.map(i => ({
                requestedQty: i.requestedQty,
                productId: i.productId,
              })),
            },
          },
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
      include: {
        items: { include: { product: { include: { category: true } } } },
        store: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found!');
    }
    return order;
  }
}
