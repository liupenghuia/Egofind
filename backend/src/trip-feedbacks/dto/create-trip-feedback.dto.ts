import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TripFeedbackReason } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTripFeedbackDto {
  @ApiProperty({ description: '司机行程 ID' })
  @IsString()
  driverTripId!: string;

  @ApiProperty({
    enum: TripFeedbackReason,
    description: 'DRIVER_REASON=司机原因（计月额度）；PASSENGER_REASON=个人原因',
  })
  @IsEnum(TripFeedbackReason)
  reason!: TripFeedbackReason;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  remark?: string;
}
