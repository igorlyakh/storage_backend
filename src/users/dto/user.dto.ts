import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { AdminScope, Role } from 'generated/prisma/enums';

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
