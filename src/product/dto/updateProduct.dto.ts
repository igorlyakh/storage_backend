import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { AdminScope } from 'generated/prisma/enums';

export class UpdateProductDto {
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  limitPerOrder?: number;

  @IsEnum(AdminScope)
  @IsOptional()
  category?: AdminScope;
}
