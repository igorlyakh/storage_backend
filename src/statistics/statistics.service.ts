import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getMonthlyStats(year: number, month: number, productId?: string) {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const allStores = await this.prisma.store.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const result = allStores.map(store => ({
      storeId: store.id,
      storeName: store.name,
      value: 0,
    }));

    const isProductFilterActive =
      productId && productId !== 'null' && productId !== 'undefined' && productId !== '';

    if (!isProductFilterActive) {
      const orderCounts = await this.prisma.order.groupBy({
        by: ['storeId'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: {
          id: true,
        },
      });

      orderCounts.forEach(oc => {
        const index = result.findIndex(r => r.storeId === oc.storeId);
        if (index !== -1) {
          result[index].value = oc._count.id;
        }
      });
    } else {
      const orders = await this.prisma.order.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          items: { some: { productId } },
        },
        select: {
          storeId: true,
          items: {
            where: { productId },
            select: { requestedQty: true },
          },
        },
      });

      orders.forEach(order => {
        const index = result.findIndex(r => r.storeId === order.storeId);
        if (index !== -1) {
          const itemsSum = order.items.reduce((sum, item) => sum + item.requestedQty, 0);
          result[index].value += itemsSum;
        }
      });
    }

    return result;
  }

  async getYearlyStats(year: number, productId?: string) {
    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const allStores = await this.prisma.store.findMany({ select: { name: true } });
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

    const monthlyData = monthNames.map(month => {
      const monthRow: any = { month };
      allStores.forEach(store => {
        monthRow[store.name] = 0;
      });
      return monthRow;
    });

    const isProductFilterActive =
      productId && productId !== 'null' && productId !== 'undefined' && productId !== '';

    if (!isProductFilterActive) {
      const orders = await this.prisma.order.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { createdAt: true, store: { select: { name: true } } },
      });

      orders.forEach(order => {
        const monthIndex = order.createdAt.getUTCMonth();
        const storeName = order.store.name;
        if (monthlyData[monthIndex][storeName] !== undefined) {
          monthlyData[monthIndex][storeName] += 1;
        }
      });
    } else {
      const orders = await this.prisma.order.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          items: { some: { productId } },
        },
        select: {
          createdAt: true,
          store: { select: { name: true } },
          items: {
            where: { productId },
            select: { requestedQty: true },
          },
        },
      });

      orders.forEach(order => {
        const monthIndex = order.createdAt.getUTCMonth();
        const storeName = order.store.name;
        if (monthlyData[monthIndex][storeName] !== undefined) {
          const itemsSum = order.items.reduce((sum, item) => sum + item.requestedQty, 0);
          monthlyData[monthIndex][storeName] += itemsSum;
        }
      });
    }

    return monthlyData;
  }
}
