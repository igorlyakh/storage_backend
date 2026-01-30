import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Role } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.username, dto.password);
    if (user) {
      const accessToken = await this.generateToken(user.id, user.username, user.role);
      await this.prismaService.user.update({
        where: { id: user.id },
        data: { accessToken },
      });
      return {
        username: user.username,
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
}
