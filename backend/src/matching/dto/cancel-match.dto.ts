import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelMatchDto {
  @ApiPropertyOptional({ description: '取消原因（可选）' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
