import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role, User } from 'generated/prisma/client';
import { Roles } from 'src/decorators/role.decorator';
import { CurrentUser } from 'src/decorators/user.decorator';
import { RolesGuard } from 'src/guards/role.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RestoreDto } from './dto/restore.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @HttpCode(200)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  @Post('/logout')
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/restore')
  async restore(@Body() dto: RestoreDto) {
    return await this.authService.restore(dto);
  }
}
