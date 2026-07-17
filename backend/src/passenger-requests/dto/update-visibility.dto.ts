import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Visibility } from '@prisma/client';

export class UpdateVisibilityDto {
  @ApiProperty({ enum: Visibility })
  @IsEnum(Visibility)
  visibility!: Visibility;
}
