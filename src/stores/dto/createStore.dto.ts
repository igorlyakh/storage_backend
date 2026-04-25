import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  brandIds: string[];
}
