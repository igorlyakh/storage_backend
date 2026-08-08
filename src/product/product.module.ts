import { Module } from '@nestjs/common';
import { StoresModule } from '../stores/stores.module';
import { StoresService } from '../stores/stores.service';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [StoresModule, WarehousesModule],
  controllers: [ProductController],
  providers: [ProductService, StoresService],
})
export class ProductModule {}
