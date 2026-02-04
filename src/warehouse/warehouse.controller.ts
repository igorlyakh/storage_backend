import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'generated/prisma/enums';
import { Roles } from 'src/decorators/role.decorator';
import { RolesGuard } from 'src/guards/role.guard';
import { OperationDto } from './dto/operation.dto';
import { WarehouseService } from './warehouse.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Patch('increase')
  async increaseProduct(@Body() dto: OperationDto) {
    return await this.warehouseService.increaseItem(dto);
  }

  @Patch('decrease')
  async decreaseProduct(@Body() dto: OperationDto) {
    return await this.warehouseService.decreaseItem(dto);
  }
}
