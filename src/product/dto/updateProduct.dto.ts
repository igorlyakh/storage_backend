import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { AdminScope } from 'generated/prisma/enums';

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

  @IsEnum(AdminScope)
  @IsOptional()
  category?: AdminScope;
}
