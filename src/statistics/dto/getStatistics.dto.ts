import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class GetStatisticsDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  storeId?: string;
}
