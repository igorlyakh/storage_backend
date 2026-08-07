import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectOrderDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @MaxLength(500)
  reason: string;
}
