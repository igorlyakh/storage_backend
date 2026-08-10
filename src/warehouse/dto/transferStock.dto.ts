import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class TransferStockDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  fromWarehouseId: string;

  @IsString()
  @IsNotEmpty()
  toWarehouseId: string;
}
