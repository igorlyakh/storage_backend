import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role, WarehouseRequestStatus } from '@prisma/client';
import { Roles } from 'src/decorators/role.decorator';
import { RolesGuard } from 'src/guards/role.guard';
import { ScopeAccessGuard } from 'src/guards/scopeAccess.guard';
import { CreateWarehouseRequestDto } from './dto/create-warehouse-request.dto';
import { OperationDto } from './dto/operation.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { UpdateRequestItemsDto } from './dto/updated-request-items.dto';
import { WarehouseService } from './warehouse.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.WAREHOUSE)
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @UseGuards(ScopeAccessGuard)
  @Patch('increase')
  async increaseProduct(@Body() dto: OperationDto) {
    return await this.warehouseService.increaseItem(dto);
  }

  @UseGuards(ScopeAccessGuard)
  @Patch('decrease')
  async decreaseProduct(@Body() dto: OperationDto) {
    return await this.warehouseService.decreaseItem(dto);
  }

  @UseGuards(ScopeAccessGuard)
  @Patch('set')
  async setProductQuantity(@Body() dto: OperationDto) {
    return await this.warehouseService.setItemQuantity(dto);
  }

  @Post()
  @Roles(Role.WAREHOUSE)
  async createRequest(@Req() req, @Body() dto: CreateWarehouseRequestDto) {
    const userId = req.user.id;
    return this.warehouseService.createRequest(userId, dto);
  }

  @Get('orders')
  @Roles(Role.ADMIN)
  async getAdminRequests(
    @Req() req,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const adminScopes = req.user.adminScopes;
    return this.warehouseService.getAdminRequests(adminScopes, {
      statuses: status
        ? (status.split(',') as WarehouseRequestStatus[])
        : undefined,
      startDate,
      endDate,
    });
  }

  @Roles(Role.WAREHOUSE)
  @Get('requests')
  async getWarehouseRequests(
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.warehouseService.getWarehouseRequests({
      statuses: status
        ? (status.split(',') as WarehouseRequestStatus[])
        : undefined,
      startDate,
      endDate,
    });
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRequestStatusDto,
    @Req() req,
  ) {
    const user = req.user;
    return this.warehouseService.updateStatus(id, dto, user);
  }

  @Get(':id')
  async getWarehouseRequestById(@Param('id') id: string) {
    return this.warehouseService.getWarehouseRequestById(id);
  }

  @Patch(':id/items')
  @Roles(Role.ADMIN, Role.WAREHOUSE)
  async updateRequestItems(@Param('id') id: string, @Body() dto: UpdateRequestItemsDto) {
    return this.warehouseService.updateRequestItems(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async deleteRequest(@Param('id') id: string) {
    return this.warehouseService.deleteRequest(id);
  }
}
