import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetStatisticsDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'null' || value === 'undefined' || value === '') return undefined;
    return Number(value);
  })
  @IsNumber()
  storeId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'null' || value === 'undefined' || value === '') return undefined;
    return String(value);
  })
  @IsString()
  productId?: string;
}
