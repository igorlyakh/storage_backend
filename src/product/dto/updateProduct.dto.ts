import { IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';
import { AdminScope } from 'generated/prisma/enums';

export class UpdateProductDto {
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsOptional()
  @IsInt()
  limitPerOrder?: number;

  @IsEnum(AdminScope)
  @IsOptional()
  category?: AdminScope;
}
