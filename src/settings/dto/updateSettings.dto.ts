import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  orderDayFrom?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  orderDayTo?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Cutoff time must be in HH:mm format',
  })
  orderCutoffTime?: string;

  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  maintenanceMessage?: string | null;

  @IsOptional()
  @IsEmail()
  maintenanceEmail?: string;
}
