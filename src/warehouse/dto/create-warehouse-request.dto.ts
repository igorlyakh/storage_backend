import { PackageType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class RequestItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsEnum(PackageType)
  @IsOptional()
  packageType?: PackageType;
}

export class CreateWarehouseRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestItemDto)
  items: RequestItemDto[];

  @IsString()
  @IsOptional()
  sourceWarehouseId?: string;
}
