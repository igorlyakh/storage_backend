import {
  Controller,
  Get,
  Query,
  Res,
  StreamableFile,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { Response } from 'express';
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
  async getStatistics(
    @Query(new ValidationPipe({ transform: true })) filters: GetStatisticsDto,
  ) {
    return this.statsService.getStatisticsData(filters);
  }

  @Get('export')
  async exportExcel(
    @Query(new ValidationPipe({ transform: true })) filters: GetStatisticsDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.statsService.generateExcelReport(filters);

    const safeStartDate = filters.startDate ? filters.startDate.split('T')[0] : 'All';
    const safeEndDate = filters.endDate ? filters.endDate.split('T')[0] : 'All';
    const fileName = `Product_Statistics_${safeStartDate}_to_${safeEndDate}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    return new StreamableFile(buffer);
  }
}
