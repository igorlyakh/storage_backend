import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
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
import { UpdateStoreDto } from './dto/updateStore.dto';
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

  @Roles(Role.ADMIN)
  @Patch(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  async updateStore(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStoreDto) {
    return await this.storesService.updateStore(id, dto);
  }

  @HttpCode(200)
  @Delete(':id')
  async deleteStore(@Param('id', ParseIntPipe) id: number) {
    return await this.storesService.deleteStoreById(id);
  }

  @Get('')
  async getAllStore() {
    return await this.storesService.getAllStores();
  }
}
