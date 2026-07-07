import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ReorderProductDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}
