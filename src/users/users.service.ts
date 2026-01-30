import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
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
    const user = this.prisma.user.create({
      data: { ...userDto },
      include: { store: true, warehouseRequests: true },
    });
    return user;
  }
}
