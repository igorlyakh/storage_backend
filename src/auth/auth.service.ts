import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from 'generated/prisma/client';
import { Role } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RestoreDto } from './dto/restore.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.username, dto.password);
    if (user) {
      const accessToken = await this.generateToken(user.id, user.username, user.role);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { accessToken },
      });
      return {
        username: user.username,
        role: user.role,
        adminScopes: user.adminScopes,
        accessToken,
      };
    }
  }

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new HttpException('Wrong password or username!', 401);
    }
    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) {
      throw new HttpException('Wrong password or username!', 401);
    }
    return user;
  }

  private async generateToken(id: string, username: string, role: Role) {
    const payload = { id, username, role };
    const accessToken = this.jwt.sign(payload);
    return accessToken;
  }

  async logout(user: User) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { accessToken: null },
    });
  }

  async restore(dto: RestoreDto) {
    const hashedPassword = await this.usersService.hashPassword(dto.newPassword);
    return await this.prisma.user.update({
      where: { id: dto.userId },
      data: { password: hashedPassword },
    });
  }
}
