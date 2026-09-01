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
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../decorators/user.decorator';
import { Roles } from '../decorators/role.decorator';
import { RolesGuard } from '../guards/role.guard';
import { CreateSupplierDto } from './dto/createSupplier.dto';
import { UpdateSupplierDto } from './dto/updateSupplier.dto';
import { SuppliersService } from './suppliers.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get('')
  async getAllSuppliers(@CurrentUser() user: User) {
    return await this.suppliersService.getAllSuppliers(user.id);
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Post('')
  async createSupplier(@CurrentUser() user: User, @Body() dto: CreateSupplierDto) {
    return await this.suppliersService.createSupplier(user.id, dto);
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Patch(':id')
  async updateSupplier(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return await this.suppliersService.updateSupplier(user.id, id, dto);
  }

  @Delete(':id')
  async deleteSupplier(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.suppliersService.deleteSupplier(user.id, id);
  }
}
