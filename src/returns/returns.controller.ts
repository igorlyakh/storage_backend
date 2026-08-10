import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReturnStatus, Role, User } from '@prisma/client';
import { CurrentUser } from '../decorators/user.decorator';
import { Roles } from '../decorators/role.decorator';
import { RolesGuard } from '../guards/role.guard';
import { CreateReturnDto } from './dto/createReturn.dto';
import { RejectReturnDto } from './dto/rejectReturn.dto';
import { ReturnsService } from './returns.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Roles(Role.STORE)
  @Post('photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(png|jpe?g|webp|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return await this.returnsService.uploadPhoto(file);
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Roles(Role.STORE)
  @Post('')
  async createReturn(@CurrentUser() user: User, @Body() dto: CreateReturnDto) {
    return await this.returnsService.createReturn(user, dto);
  }

  @Roles(Role.STORE)
  @Get('')
  async getMyReturns(
    @CurrentUser('storeId') storeId: number,
    @Query('status') status?: string,
  ) {
    return await this.returnsService.getMyReturns(
      storeId,
      status ? (status.split(',') as ReturnStatus[]) : undefined,
    );
  }

  @Roles(Role.ADMIN)
  @Get('all')
  async getAllReturns(
    @Query('status') status?: string,
    @Query('storeIds') storeIds?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.returnsService.getAllReturns({
      statuses: status ? (status.split(',') as ReturnStatus[]) : undefined,
      storeIds: storeIds ? storeIds.split(',').map(id => Number(id)) : undefined,
      startDate,
      endDate,
    });
  }

  @Roles(Role.DRIVER)
  @Get('driver')
  async getDriverReturns() {
    return await this.returnsService.getDriverReturns();
  }

  @Roles(Role.WAREHOUSE)
  @Get('warehouse')
  async getWarehouseReturns() {
    return await this.returnsService.getWarehouseReturns();
  }

  @Roles(Role.STORE, Role.ADMIN, Role.DRIVER, Role.WAREHOUSE)
  @Get(':id')
  async getReturnById(@Param('id') id: string, @CurrentUser() user: User) {
    return await this.returnsService.getReturnById(id, user);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/approve')
  async approveReturn(@Param('id') id: string, @CurrentUser() user: User) {
    return await this.returnsService.approveReturn(id, user.id);
  }

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @Roles(Role.ADMIN)
  @Patch(':id/reject')
  async rejectReturn(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: RejectReturnDto,
  ) {
    return await this.returnsService.rejectReturn(id, user.id, dto.reason);
  }

  @Roles(Role.DRIVER)
  @Patch(':id/pickup')
  async pickupReturn(@Param('id') id: string, @CurrentUser() user: User) {
    return await this.returnsService.pickupReturn(id, user.id);
  }

  @Roles(Role.WAREHOUSE)
  @Patch(':id/close')
  async closeReturn(@Param('id') id: string, @CurrentUser() user: User) {
    return await this.returnsService.closeReturn(id, user.id);
  }
}
