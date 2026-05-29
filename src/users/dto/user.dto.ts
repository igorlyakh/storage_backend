import { AdminScope, Role } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Minimum password length is 6 characters!' })
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  storeId: number;

  @IsOptional()
  @IsEnum(AdminScope, { each: true })
  @IsArray()
  adminScopes: AdminScope[];
}
