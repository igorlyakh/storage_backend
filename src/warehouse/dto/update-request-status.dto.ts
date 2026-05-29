import { WarehouseRequestStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateRequestStatusDto {
  @IsEnum(WarehouseRequestStatus)
  status: WarehouseRequestStatus;
}
