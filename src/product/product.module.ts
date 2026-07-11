import { Module } from '@nestjs/common';
import { StoresModule } from 'src/stores/stores.module';
import { StoresService } from 'src/stores/stores.service';
import { WarehousesModule } from 'src/warehouses/warehouses.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [StoresModule, WarehousesModule],
  controllers: [ProductController],
  providers: [ProductService, StoresService],
})
export class ProductModule {}
