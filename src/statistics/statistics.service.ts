import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { GetStatisticsDto } from './dto/getStatistics.dto';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getStatisticsData(filters: GetStatisticsDto) {
    const { startDate, endDate, productId, storeId } = filters;

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate.setHours(0, 0, 0, 0));
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate.setHours(23, 59, 59, 999));
      }
    }

    if (storeId) {
      where.storeId = storeId;
    }

    if (productId) {
      where.items = { some: { productId } };
    }

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        createdAt: true,
        store: { select: { id: true, name: true } },
        items: productId
          ? { where: { productId }, select: { requestedQty: true } }
          : undefined,
      },
      orderBy: { createdAt: 'asc' },
    });

    const flatData = orders.map(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];

      let value = 1;
      if (productId && order.items) {
        value = order.items.reduce((sum, item) => sum + item.requestedQty, 0);
      }

      return {
        date: dateKey,
        storeName: order.store.name,
        value,
      };
    });

    const aggregated = flatData.reduce(
      (acc, curr) => {
        const key = `${curr.date}_${curr.storeName}`;
        if (!acc[key]) {
          acc[key] = { ...curr };
        } else {
          acc[key].value += curr.value;
        }
        return acc;
      },
      {} as Record<string, { date: string; storeName: string; value: number }>,
    );

    return Object.values(aggregated);
  }

  async generateExcelReport(filters: GetStatisticsDto): Promise<Buffer> {
    const data = await this.getStatisticsData(filters);

    const templatePath = path.join(
      process.cwd(),
      'src',
      'templates',
      'statistics-template.xlsx',
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const dataSheet = workbook.getWorksheet('Data');

    dataSheet.spliceRows(2, dataSheet.rowCount - 1);

    data.forEach(row => {
      dataSheet.addRow([row.date, row.storeName, row.value]);
    });

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }
}
