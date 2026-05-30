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

    if (!startDate) {
      return [];
    }

    const gteDate = new Date(startDate);
    const lteDate = endDate ? new Date(endDate) : new Date(startDate);
    lteDate.setUTCHours(23, 59, 59, 999);

    const where: any = {
      createdAt: {
        gte: gteDate,
        lte: lteDate,
      },
    };

    if (storeId) {
      where.storeId = Number(storeId);
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
          ? {
              where: { productId },
              select: { requestedQty: true },
            }
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
        storeName: order.store?.name || 'Unknown Store',
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

    if (dataSheet && dataSheet.rowCount > 1) {
      dataSheet.spliceRows(2, dataSheet.rowCount - 1);
    }

    data.forEach(row => {
      dataSheet?.addRow([row.date, row.storeName, row.value]);
    });

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }
}
