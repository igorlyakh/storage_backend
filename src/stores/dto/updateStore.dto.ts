import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateStoreDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  brandId?: string;
}
