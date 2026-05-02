import { Controller, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { Role } from 'generated/prisma/enums';
import { Roles } from 'src/decorators/role.decorator';
import { RolesGuard } from 'src/guards/role.guard';
import { StatisticsService } from './statistics.service';

@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.WAREHOUSE)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statsService: StatisticsService) {}

  @Get('monthly')
  async getMonthly(
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @Query('productId') productId?: string,
  ) {
    return this.statsService.getMonthlyStats(year, month, productId);
  }

  @Get('yearly')
  async getYearly(
    @Query('year', ParseIntPipe) year: number,
    @Query('productId') productId?: string,
  ) {
    return this.statsService.getYearlyStats(year, productId);
  }
}
