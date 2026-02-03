import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { ProductModule } from './product/product.module';
import { WarehouseModule } from './warehouse/warehouse.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, StoresModule, ProductModule, WarehouseModule],
})
export class AppModule {}
