import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { SendOrderDto } from './dto/sendOrder.dto';
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
  async getAll(
    @Query('page') page?: string,
    @Query('storeIds') storeIds?: string,
    @Query('statuses') statuses?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNumber = Math.max(1, Number(page) || 1);

    return await this.ordersService.getAllOrders(pageNumber, {
      storeIds: storeIds ? storeIds.split(',').map(id => Number(id)) : undefined,
      statuses: statuses ? statuses.split(',') : undefined,
      startDate: startDate,
      endDate: endDate,
    });
  }

  @Roles(Role.STORE)
  @Get('')
  async getOrdersByStoreId(
    @CurrentUser('storeId') storeId: number,
    @Query('page') page?: string,
    @Query('statuses') statuses?: string | string[],
    @Query('date') date?: string,
  ) {
    const pageNumber = Math.max(1, Number(page) || 1);
    let parsedStatuses: string[] | undefined;
    if (statuses) {
      parsedStatuses = Array.isArray(statuses) ? statuses : statuses.split(',');
    }
    return await this.ordersService.getAllOrdersByStoreId(storeId, pageNumber, {
      statuses: parsedStatuses,
      date: date,
    });
  }

  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @Patch('/processing')
  async startProcessing(@Body('orderId') orderId: string) {
    return await this.ordersService.startProcessing(orderId);
  }

  @Roles(Role.WAREHOUSE, Role.ADMIN)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Patch('/send')
  async sendOrder(@Body() dto: SendOrderDto) {
    return await this.ordersService.sendOrder(dto);
  }

  @Get('/:id')
  async getOrderById(@Param('id') id: string) {
    const order = await this.ordersService.getOrderById(id);
    return order;
  }
}
