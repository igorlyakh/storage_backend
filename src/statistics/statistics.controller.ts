import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { Role } from 'generated/prisma/enums';
import { Roles } from 'src/decorators/role.decorator';
import { RolesGuard } from 'src/guards/role.guard';
import { GetStatisticsDto } from './dto/getStatistics.dto';
import { StatisticsService } from './statistics.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.WAREHOUSE)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statsService: StatisticsService) {}

  @Get('data')
  async getStatistics(@Query() filters: GetStatisticsDto) {
    return this.statsService.getStatisticsData(filters);
  }

  @Get('export')
  async exportExcel(@Query() filters: GetStatisticsDto, @Res() res: Response) {
    const buffer = await this.statsService.generateExcelReport(filters);

    const fileName = `Statistics_${filters.startDate || 'All'}_to_${filters.endDate || 'All'}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
    });

    res.send(buffer);
  }
}
