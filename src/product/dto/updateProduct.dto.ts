import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Categories } from 'generated/prisma/enums';

export class UpdateProductDto {
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  limitPerOrder?: number;

  @IsEnum(Categories)
  @IsOptional()
  category?: Categories;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  brandIds?: string[];
}
