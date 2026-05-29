import { AdminScope, Role } from '@prisma/client';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required!' })
  username: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsArray()
  @IsEnum(AdminScope, { each: true })
  adminScopes?: AdminScope[];
}
