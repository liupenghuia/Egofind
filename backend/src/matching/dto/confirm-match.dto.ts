import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmMatchDto {
  @ApiProperty({ description: '司机行程 ID' })
  @IsString()
  driverTripId!: string;

  @ApiProperty({ description: '乘客需求 ID' })
  @IsString()
  passengerRequestId!: string;
}
