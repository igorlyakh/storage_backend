import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { ProductModule } from './product/product.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { OrdersModule } from './orders/orders.module';
import { BrandsModule } from './brands/brands.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, StoresModule, ProductModule, WarehouseModule, OrdersModule, BrandsModule, StatisticsModule],
})
export class AppModule {}
