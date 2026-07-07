import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/CreateBrand.dto';
import { UpdateBrandDto } from './dto/UpdateBrand.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get('')
  async getAllBrands() {
    return await this.brandsService.getAllBrands();
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Post('')
  async createBrand(@Body() dto: CreateBrandDto) {
    return await this.brandsService.createBrand(dto);
  }

  @Delete('')
  async deleteBrand(@Body('name') name: string) {
    return await this.brandsService.deleteBrand(name);
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Patch(':id')
  async updateBrand(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return await this.brandsService.updateBrand(id, dto);
  }
}
