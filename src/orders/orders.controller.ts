import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'generated/prisma/enums';
import { Roles } from 'src/decorators/role.decorator';
import { CurrentUser } from 'src/decorators/user.decorator';
import { RolesGuard } from 'src/guards/role.guard';
import { CreateOrderDto } from './dto/createOrder.dto';
import { OrdersService } from './orders.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Roles(Role.STORE)
  @Post('')
  async createOrder(@CurrentUser() user, @Body() dto: CreateOrderDto) {
    return await this.ordersService.createOrder(user.storeId, dto);
  }

  @Roles(Role.ADMIN, Role.WAREHOUSE)
  @Get('/all')
  async getAll() {
    return await this.ordersService.getAllOrders();
  }

  @Roles(Role.STORE)
  @Get('')
  async getOrdersByStoreId(@CurrentUser('storeId') storeId: number) {
    return await this.ordersService.getAllOrdersByStoreId(storeId);
  }

  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @Patch('/processing')
  async startProcessing(@Body('orderId') orderId: string) {
    return await this.ordersService.startProcessing(orderId);
  }
}
