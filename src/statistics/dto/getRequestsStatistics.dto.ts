import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AdminScope } from '@prisma/client';

export class GetRequestsStatisticsDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'null' || value === 'undefined' || value === '') return undefined;
    return String(value);
  })
  @IsString()
  productId?: string;

  @IsOptional()
  @IsEnum(AdminScope)
  category?: AdminScope;
}
