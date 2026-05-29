import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UpdateRoleDto } from './dto/updateRole.dto';
import { UserDto } from './dto/user.dto';
import { UsersService } from './users.service';

// @UseGuards(AuthGuard('jwt'), RolesGuard)
// @Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  async createUser(@Body() createUser: UserDto) {
    const candidate = await this.usersService.findByUsername(createUser.username);
    if (candidate) {
      throw new ConflictException('Username is already exists!');
    }
    const user = await this.usersService.createUser(createUser);
    return user;
  }

  @HttpCode(200)
  @Delete('')
  async deleteUser(@Body('id') id: string) {
    const result = await this.usersService.deleteUserById(id);
    return result;
  }

  @Get('')
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Patch('')
  async updateUserRole(@Body() dto: UpdateRoleDto) {
    return await this.usersService.updateRoleByName(dto);
  }
}
