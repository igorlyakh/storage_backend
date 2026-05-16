import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { AdminScope } from 'generated/prisma/enums';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AdminScope)
  @IsNotEmpty()
  tag: AdminScope;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  limitPerOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  initialQuantity?: number;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  brandsIds: string[];
}
