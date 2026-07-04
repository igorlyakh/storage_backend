import { Categories, PackageType } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

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

  @IsOptional()
  @IsString()
  @Length(9, 9, { message: 'Article must be 9 characters long' })
  article?: string;

  @IsOptional()
  category?: Categories;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  brandIds?: string[];

  @IsOptional()
  @IsEnum(PackageType)
  packageType?: PackageType;

  @IsOptional()
  @IsInt()
  itemsPerPackage?: number;
}
