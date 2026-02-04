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
import { Role } from 'generated/prisma/enums';
import { Roles } from 'src/decorators/role.decorator';
import { CategoryAccessGuard } from 'src/guards/access.guard';
import { RolesGuard } from 'src/guards/role.guard';
import { CreateProductDto } from './dto/createProduct.dto';
import { DeleteProductDto } from './dto/deleteProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { ProductService } from './product.service';

@UseGuards(AuthGuard('jwt'), RolesGuard, CategoryAccessGuard)
@Roles(Role.ADMIN)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Post('')
  async createProduct(@Body() dto: CreateProductDto) {
    return await this.productService.createProduct(dto);
  }

  @Get('')
  async getAllProduct() {
    return await this.productService.getAllProducts();
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Delete()
  async delete(@Body() dto: DeleteProductDto) {
    return await this.productService.deleteById(dto.id);
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Patch(':id')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return await this.productService.updateProductById(id, dto);
  }
}
