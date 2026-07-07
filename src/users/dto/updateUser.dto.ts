import { AdminScope, Role } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsInt()
  storeId?: number | null;

  @IsOptional()
  @IsArray()
  @IsEnum(AdminScope, { each: true })
  adminScopes?: AdminScope[];
}
