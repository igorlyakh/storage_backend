import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { BrandsModule } from './brands/brands.module';
import { CategoryModule } from './category/category.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { StatisticsModule } from './statistics/statistics.module';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './users/users.module';
import { WarehouseModule } from './warehouse/warehouse.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    StoresModule,
    ProductModule,
    WarehouseModule,
    OrdersModule,
    BrandsModule,
    StatisticsModule,
    CategoryModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', 'storage_frontend', 'dist'),
      exclude: ['/api/{*splat}'],
    }),
  ],
})
export class AppModule {}
