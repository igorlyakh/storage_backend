import { Module } from '@nestjs/common';
import { WarehousesModule } from 'src/warehouses/warehouses.module';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';

@Module({
  imports: [WarehousesModule],
  controllers: [WarehouseController],
  providers: [WarehouseService],
})
export class WarehouseModule {}
