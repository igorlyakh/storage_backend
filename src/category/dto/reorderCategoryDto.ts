import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ReorderCategoryDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}
