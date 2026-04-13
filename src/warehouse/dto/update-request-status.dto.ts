import { IsEnum } from 'class-validator';
import { WarehouseRequestStatus } from 'generated/prisma/enums';

export class UpdateRequestStatusDto {
  @IsEnum(WarehouseRequestStatus)
  status: WarehouseRequestStatus;
}
