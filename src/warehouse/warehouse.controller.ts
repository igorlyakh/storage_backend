import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'generated/prisma/enums';
import { Roles } from 'src/decorators/role.decorator';
import { CategoryAccessGuard } from 'src/guards/access.guard';
import { OperationDto } from './dto/operation.dto';
import { WarehouseService } from './warehouse.service';

@UseGuards(AuthGuard('jwt'))
@Roles(Role.ADMIN)
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @UseGuards(CategoryAccessGuard)
  @Post('increase')
  async increaseProduct(dto: OperationDto) {
    return await this.warehouseService.increaseItem(dto);
  }

  @UseGuards(CategoryAccessGuard)
  @Post('decrease')
  async decreaseProduct(dto: OperationDto) {
    return await this.warehouseService.decreaseItem(dto);
  }
}
