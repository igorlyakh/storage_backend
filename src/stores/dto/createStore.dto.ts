import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsNotEmpty()
  brandIds: string[];
}
