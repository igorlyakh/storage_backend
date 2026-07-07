import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { GetStatisticsDto } from './dto/getStatistics.dto';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getStatisticsData(filters: GetStatisticsDto) {
    const { startDate, endDate, productId, storeId } = filters;

    if (!startDate) return [];

    const gteDate = new Date(startDate);
    const lteDate = endDate ? new Date(endDate) : new Date(startDate);
    lteDate.setUTCHours(23, 59, 59, 999);

    const where: any = {
      createdAt: {
        gte: gteDate,
        lte: lteDate,
      },
    };

    if (storeId) where.storeId = storeId;
    if (productId) where.items = { some: { productId } };

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
    const { startDate, endDate, productId, storeId } = filters;
    if (!startDate) return Buffer.from([]);

    const gteDate = new Date(startDate);
    const lteDate = endDate ? new Date(endDate) : new Date(startDate);
    lteDate.setUTCHours(23, 59, 59, 999);

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: gteDate, lte: lteDate },
          ...(storeId && { storeId }),
        },
        ...(productId && { productId }),
      },
      include: {
        product: { select: { name: true, article: true } },
        order: { select: { store: { select: { name: true } } } },
      },
    });

    const storesSet = new Set<string>();
    const productsMap = new Map<string, { name: string; article: string }>();
    const matrix: Record<
      string,
      Record<string, { timesOrdered: number; totalQuantity: number }>
    > = {};

    orderItems.forEach(item => {
      const pName = item.product?.name || 'Unknown Product';
      const pArticle = item.product?.article || '000000-00';
      const sName = item.order?.store?.name || 'Unknown Store';

      storesSet.add(sName);
      if (!productsMap.has(pName)) {
        productsMap.set(pName, { name: pName, article: pArticle });
      }

      if (!matrix[pName]) matrix[pName] = {};
      if (!matrix[pName][sName])
        matrix[pName][sName] = { timesOrdered: 0, totalQuantity: 0 };

      matrix[pName][sName].timesOrdered += 1;
      matrix[pName][sName].totalQuantity += item.requestedQty;
    });

    const sortedStores = Array.from(storesSet).sort((a, b) => a.localeCompare(b));
    const sortedProducts = Array.from(productsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Matrix Statistics');

    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'CCCCCC' } },
      left: { style: 'thin', color: { argb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
      right: { style: 'thin', color: { argb: 'CCCCCC' } },
    };

    const headerBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: '999999' } },
      left: { style: 'thin', color: { argb: '999999' } },
      bottom: { style: 'medium', color: { argb: '666666' } },
      right: { style: 'thin', color: { argb: '999999' } },
    };

    const totalColumns = 2 + sortedStores.length * 2;

    const formatDate = (date: Date) =>
      [date.getUTCDate(), date.getUTCMonth() + 1, date.getUTCFullYear()]
        .map(n => String(n).padStart(2, '0'))
        .join('.');

    const periodRow = sheet.getRow(1);
    periodRow.getCell(1).value =
      `Statistics for: ${formatDate(gteDate)} — ${formatDate(lteDate)}`;
    sheet.mergeCells(1, 1, 1, totalColumns);
    periodRow.getCell(1).font = { bold: true };
    periodRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    periodRow.height = 22;

    const row1 = sheet.getRow(2);
    row1.getCell(1).value = 'Product Information';
    sheet.mergeCells(2, 1, 2, 2);

    let currentColumn = 3;
    sortedStores.forEach(store => {
      row1.getCell(currentColumn).value = store;
      sheet.mergeCells(2, currentColumn, 2, currentColumn + 1);
      currentColumn += 2;
    });

    const row2 = sheet.getRow(3);
    row2.getCell(1).value = 'Product Name';
    row2.getCell(2).value = 'Article';

    currentColumn = 3;
    sortedStores.forEach(() => {
      row2.getCell(currentColumn).value = 'Orders';
      row2.getCell(currentColumn + 1).value = 'Qty';
      currentColumn += 2;
    });

    [row1, row2].forEach(row => {
      row.font = { bold: true };
      row.height = row === row1 ? 25 : 20;

      for (let i = 1; i <= totalColumns; i++) {
        const cell = row.getCell(i);
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F2F2' },
        };
        cell.border = headerBorder;
      }
    });

    sortedProducts.forEach(product => {
      const rowData: any[] = [product.name, product.article];

      sortedStores.forEach(store => {
        const stats = matrix[product.name]?.[store];
        rowData.push(stats ? stats.timesOrdered : 0);
        rowData.push(stats ? stats.totalQuantity : 0);
      });

      const addedRow = sheet.addRow(rowData);
      addedRow.height = 20;

      addedRow.eachCell({ includeEmpty: true }, cell => {
        cell.border = thinBorder;
      });
    });

    sheet.columns.forEach((col, index) => {
      if (index === 0) {
        col.width = 40;
        col.alignment = { vertical: 'middle', horizontal: 'left' };
      } else if (index === 1) {
        col.width = 18;
        col.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        col.width = 12;
        col.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }
}
