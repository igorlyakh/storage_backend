import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Language } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/updateUser.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { store: true },
    });
    return user;
  }

  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { store: true },
    });
    return user;
  }

  async createUser(userDto: UserDto) {
    const hashedPassword = await this.hashPassword(userDto.password);
    const user = await this.prisma.user.create({
      data: { ...userDto, password: hashedPassword },
      select: {
        id: true,
        username: true,
        store: true,
        storeId: true,
        language: true,
      },
    });
    return user;
  }

  async hashPassword(password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  }

  async deleteUserById(id: string) {
    const candidate = await this.prisma.user.findUnique({ where: { id } });
    if (!candidate) {
      throw new NotFoundException('User is not found!');
    }
    return await this.prisma.user.delete({ where: { id } });
  }

  async getAllUsers() {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        store: true,
        adminScopes: true,
        language: true,
      },
    });
  }

  async updateUserById(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id: ${id} not found!`);
    }

    if (dto.username && dto.username !== user.username) {
      const candidate = await this.findByUsername(dto.username);
      if (candidate) {
        throw new ConflictException('Username is already exists!');
      }
    }

    return await this.prisma.user.update({
      where: { id },
      data: { ...dto },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        store: true,
        adminScopes: true,
        language: true,
      },
    });
  }

  async updateLanguage(id: string, language: Language) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id: ${id} not found!`);
    }

    return await this.prisma.user.update({
      where: { id },
      data: { language },
      select: {
        id: true,
        language: true,
      },
    });
  }
}
