import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}
  async getMonthlyStats(year: number, month: number, productId?: string) {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const orderWhere: any = {
      createdAt: { gte: startDate, lte: endDate },
    };

    if (productId) {
      orderWhere.items = { some: { productId } };
    }

    const orders = await this.prisma.order.findMany({
      where: orderWhere,
      select: {
        store: { select: { id: true, name: true } },
        items: {
          where: productId ? { productId } : undefined,
          select: { requestedQty: true },
        },
      },
    });

    const statsMap = new Map();

    for (const order of orders) {
      const storeId = order.store.id;

      if (!statsMap.has(storeId)) {
        statsMap.set(storeId, {
          storeId,
          storeName: order.store.name,
          totalOrders: 0,
          totalItems: 0,
        });
      }

      const storeStat = statsMap.get(storeId);

      storeStat.totalOrders += 1;

      const itemsSum = order.items.reduce((sum, item) => sum + item.requestedQty, 0);
      storeStat.totalItems += itemsSum;
    }

    return Array.from(statsMap.values()).sort((a, b) =>
      a.storeName.localeCompare(b.storeName),
    );
  }

  async getYearlyStats(year: number, productId?: string) {
    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const orderWhere: any = {
      createdAt: { gte: startDate, lte: endDate },
    };

    if (productId) {
      orderWhere.items = { some: { productId } };
    }

    const orders = await this.prisma.order.findMany({
      where: orderWhere,
      select: {
        createdAt: true,
        store: { select: { name: true } },
        items: {
          where: productId ? { productId } : undefined,
          select: { requestedQty: true },
        },
      },
    });

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const monthlyData = monthNames.map(month => ({
      month,
      stores: {} as Record<string, { orders: number; items: number }>,
    }));

    for (const order of orders) {
      const monthIndex = order.createdAt.getUTCMonth();
      const storeName = order.store.name;

      if (!monthlyData[monthIndex].stores[storeName]) {
        monthlyData[monthIndex].stores[storeName] = { orders: 0, items: 0 };
      }

      monthlyData[monthIndex].stores[storeName].orders += 1;

      const itemsSum = order.items.reduce((sum, item) => sum + item.requestedQty, 0);
      monthlyData[monthIndex].stores[storeName].items += itemsSum;
    }

    return monthlyData;
  }
}
