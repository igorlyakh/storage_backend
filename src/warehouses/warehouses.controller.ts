import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role, User } from '@prisma/client';
import { Roles } from 'src/decorators/role.decorator';
import { CurrentUser } from 'src/decorators/user.decorator';
import { RolesGuard } from 'src/guards/role.guard';
import { CreateWarehouseDto } from './dto/createWarehouse.dto';
import { UpdateWarehouseDto } from './dto/updateWarehouse.dto';
import { WarehousesService } from './warehouses.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Roles(Role.ADMIN, Role.WAREHOUSE)
  @Get()
  async getAllWarehouses() {
    return await this.warehousesService.getAllWarehouses();
  }

  @Roles(Role.ADMIN, Role.WAREHOUSE)
  @Get(':id/stocks')
  async getWarehouseStocks(@Param('id') id: string, @CurrentUser() user: User) {
    return await this.warehousesService.getWarehouseStocks(id, user);
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Roles(Role.ADMIN)
  @Post()
  async createWarehouse(@Body() dto: CreateWarehouseDto) {
    return await this.warehousesService.createWarehouse(dto);
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Roles(Role.ADMIN)
  @Patch(':id')
  async updateWarehouse(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return await this.warehousesService.updateWarehouse(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async deleteWarehouse(@Param('id') id: string) {
    return await this.warehousesService.deleteWarehouse(id);
  }
}
