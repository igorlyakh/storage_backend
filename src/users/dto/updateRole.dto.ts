import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AdminScope, Role } from 'generated/prisma/enums';

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
