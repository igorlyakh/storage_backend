import {
  Body,
  Controller,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/decorators/user.decorator';
import { CreateOrderDto } from './dto/createOrder.dto';
import { OrdersService } from './orders.service';

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Post('')
  async createOrder(@CurrentUser() user, @Body() dto: CreateOrderDto) {
    return await this.ordersService.createOrder(user.storeId, dto);
  }
}
