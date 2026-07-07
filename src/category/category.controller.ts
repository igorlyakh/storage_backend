import {
  Body,
  Controller,
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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/createCategoryDto';
import { ReorderCategoryDto } from './dto/reorderCategoryDto';
import { UpdateCategoryDto } from './dto/updateCategoryDto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Roles(Role.ADMIN)
  @Post()
  async createCategory(@Body() dto: CreateCategoryDto) {
    return await this.categoryService.createCategory(dto);
  }

  @Roles(Role.ADMIN, Role.WAREHOUSE, Role.STORE)
  @Get()
  async getAllCategories() {
    return await this.categoryService.getAllCategories();
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Roles(Role.ADMIN)
  @Patch('reorder')
  async reorderCategories(@Body() dto: ReorderCategoryDto) {
    return await this.categoryService.reorderCategories(dto.ids);
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Roles(Role.ADMIN)
  @Patch(':id')
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return await this.categoryService.updateCategory(id, dto);
  }
}
