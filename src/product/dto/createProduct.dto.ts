import { AdminScope, PackageType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

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

  @IsString()
  @Length(9, 9, { message: 'Article must be 9 characters long' })
  article: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  brandsIds: string[];

  @IsEnum(PackageType)
  packageType: PackageType;

  @IsInt()
  itemsPerPackage: number;

  @IsInt()
  @IsOptional()
  initialPackagesCount?: number;
}
