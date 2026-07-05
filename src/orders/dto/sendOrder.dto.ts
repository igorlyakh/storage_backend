import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class SendOrderItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(0)
  quantity: number;

  @IsBoolean()
  isChecked: boolean;
}

export class SendOrderDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SendOrderItemDto)
  items?: SendOrderItemDto[];
}
