import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateRoleDto } from './dto/updateRole.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    return user;
  }

  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
    return await this.prisma.user.findMany();
  }

  async updateRoleByName(dto: UpdateRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (!user) {
      throw new NotFoundException(`User with name: ${dto.username} not found!`);
    }
    const result = await this.prisma.user.update({
      where: { username: dto.username },
      data: { ...dto },
    });
    return result;
  }
}
