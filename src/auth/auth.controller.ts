import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
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
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.login(dto);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      username: user.username,
      role: user.role,
      adminScopes: user.adminScopes,
      accessToken: tokens.accessToken,
    };
  }

  @Post('/refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const tokens = await this.authService.refresh(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }

  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  @Post('/logout')
  async logout(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken');
    await this.authService.logout(user);
  }

  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/restore')
  async restore(@Body() dto: RestoreDto) {
    return await this.authService.restore(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/me')
  async getMe(@CurrentUser() user: User) {
    return {
      username: user.username,
      role: user.role,
      adminScopes: user.adminScopes,
    };
  }
}
