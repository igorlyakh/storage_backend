import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role, User } from '@prisma/client';
import { Roles } from 'src/decorators/role.decorator';
import { CurrentUser } from 'src/decorators/user.decorator';
import { RolesGuard } from 'src/guards/role.guard';
import { ScopeAccessGuard } from 'src/guards/scopeAccess.guard';
import { ScopeCreateGuard } from 'src/guards/scopeCreate.guard';
import { CreateProductDto } from './dto/createProduct.dto';
import { DeleteProductDto } from './dto/deleteProduct.dto';
import { ReorderProductDto } from './dto/reorderProduct.dto';
import { UpdateProductDto } from './dto/updateProduct.dto';
import { ProductService } from './product.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @UseGuards(ScopeCreateGuard)
  @Roles(Role.ADMIN)
  @Post('')
  async createProduct(@Body() dto: CreateProductDto) {
    return await this.productService.createProduct(dto);
  }

  @Get('')
  async getAllProduct(@CurrentUser() user: User) {
    return await this.productService.getAllProducts(user);
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @UseGuards(ScopeAccessGuard)
  @Roles(Role.ADMIN)
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
  @Roles(Role.ADMIN)
  @Patch('reorder')
  async reorderProducts(@Body() dto: ReorderProductDto) {
    return await this.productService.reorderProducts(dto.ids);
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @UseGuards(ScopeAccessGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return await this.productService.updateProductById(id, dto);
  }

  @Get('/brands')
  async getAllProductsByBrands(@Body() brandsIds: string[], @CurrentUser() user: User) {
    return await this.productService.getAllProductsByBrands(user.storeId);
  }

  @Roles(Role.ADMIN)
  @Get('/low-stock')
  async getLowStockProducts(
    @CurrentUser() user: User,
    @Query('threshold') threshold?: string,
  ) {
    return await this.productService.getLowStockProducts(
      user,
      Number(threshold) || 20,
    );
  }
}
