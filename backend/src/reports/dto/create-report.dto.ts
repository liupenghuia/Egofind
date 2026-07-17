import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportTargetType } from '@prisma/client';

export class CreateReportDto {
  @ApiProperty({ enum: ReportTargetType })
  @IsEnum(ReportTargetType)
  targetType!: ReportTargetType;

  @ApiProperty()
  @IsString()
  targetId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @ApiProperty({ example: 'harassment' })
  @IsString()
  @MaxLength(64)
  reasonCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  detail?: string;
}
