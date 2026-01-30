import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Role } from 'generated/prisma/enums';

export class UserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password is required!' })
  password: string;

  @IsEnum(Role)
  role: Role;
}
