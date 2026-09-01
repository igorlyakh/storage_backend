import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { BrandsModule } from './brands/brands.module';
import { CategoryModule } from './category/category.module';
import { UPLOADS_ROOT } from './config/uploads';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { ReturnsModule } from './returns/returns.module';
import { SettingsModule } from './settings/settings.module';
import { StatisticsModule } from './statistics/statistics.module';
import { StoresModule } from './stores/stores.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { UsersModule } from './users/users.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { WarehousesModule } from './warehouses/warehouses.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    StoresModule,
    ProductModule,
    WarehouseModule,
    WarehousesModule,
    OrdersModule,
    BrandsModule,
    StatisticsModule,
    CategoryModule,
    SettingsModule,
    SuppliersModule,
    ReturnsModule,
    ServeStaticModule.forRoot(
      {
        rootPath: UPLOADS_ROOT,
        serveRoot: '/uploads',
        serveStaticOptions: { index: false, fallthrough: false },
      },
      {
        rootPath: join(__dirname, '..', '..', '..', 'storage_frontend', 'dist'),
        exclude: ['/api/{*splat}', '/uploads/{*splat}'],
      },
    ),
  ],
})
export class AppModule {}
