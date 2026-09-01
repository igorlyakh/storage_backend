import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateReturnItemDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  productId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  customName?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  photoUrl: string;
}

export class CreateReturnDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateReturnItemDto)
  items: CreateReturnItemDto[];
}
