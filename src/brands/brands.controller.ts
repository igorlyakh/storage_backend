import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'generated/prisma/enums';
import { Roles } from 'src/decorators/role.decorator';
import { RolesGuard } from 'src/guards/role.guard';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/CreateBrand.dto';

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
}
