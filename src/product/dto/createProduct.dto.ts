import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { AdminScope, Categories } from 'generated/prisma/enums';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AdminScope)
  @IsNotEmpty()
  tag: AdminScope;

  @IsEnum(Categories)
  @IsNotEmpty()
  category: Categories;

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
