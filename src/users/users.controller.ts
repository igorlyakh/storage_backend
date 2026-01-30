import {
  Body,
  ConflictException,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { UsersService } from './users.service';

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
}
