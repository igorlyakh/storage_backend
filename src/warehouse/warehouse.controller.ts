import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'generated/prisma/enums';
import { Roles } from 'src/decorators/role.decorator';
import { RolesGuard } from 'src/guards/role.guard';
import { ScopeAccessGuard } from 'src/guards/scopeAccess.guard';
import { CreateWarehouseRequestDto } from './dto/create-warehouse-request.dto';
import { OperationDto } from './dto/operation.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
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

  @Post()
  @Roles(Role.WAREHOUSE)
  async createRequest(@Req() req, @Body() dto: CreateWarehouseRequestDto) {
    const userId = req.user.id;
    return this.warehouseService.createRequest(userId, dto);
  }

  @Get('orders')
  @Roles(Role.ADMIN)
  async getAdminRequests(@Req() req) {
    const adminScopes = req.user.adminScopes;
    return this.warehouseService.getAdminRequests(adminScopes);
  }

  @Roles(Role.WAREHOUSE)
  @Get('requests')
  async getWarehouseRequests() {
    return this.warehouseService.getWarehouseRequests();
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
}
