import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { Roles } from 'src/decorators/role.decorator';
import { RolesGuard } from 'src/guards/role.guard';
import { CreateStoreDto } from './dto/createStore.dto';
import { StoresService } from './stores.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.WAREHOUSE)
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

  @HttpCode(200)
  @Delete('')
  async deleteStore(@Body() name: string) {
    return await this.storesService.deleteStoreByName(name);
  }

  @Get('')
  async getAllStore() {
    return await this.storesService.getAllStores();
  }
}
