import { Language } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateLanguageDto {
  @IsEnum(Language)
  language: Language;
}
