import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { AdminScope } from 'generated/prisma/enums';

export class UpdateProductDto {
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  limitPerOrder?: number;

  @IsEnum(AdminScope)
  @IsOptional()
  category?: AdminScope;
}
