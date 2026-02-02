import {
  Body,
  Controller,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'generated/prisma/enums';
import { Roles } from 'src/decorators/role.decorator';
import { CreateStoreDto } from './dto/createStore.dto';
import { StoresService } from './stores.service';

@UseGuards(AuthGuard('jwt'))
@Roles(Role.ADMIN)
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post('')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  async createStore(@Body() dto: CreateStoreDto) {
    return await this.storesService.createStore(dto);
  }
}
