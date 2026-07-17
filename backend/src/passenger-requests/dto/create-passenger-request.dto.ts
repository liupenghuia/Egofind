import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Visibility } from '@prisma/client';
import { GeoPlaceDto } from '../../common/dto/geo-place.dto';

export class CreatePassengerRequestDto {
  @ApiProperty({ type: GeoPlaceDto })
  @ValidateNested()
  @Type(() => GeoPlaceDto)
  origin!: GeoPlaceDto;

  @ApiProperty({ type: GeoPlaceDto })
  @ValidateNested()
  @Type(() => GeoPlaceDto)
  dest!: GeoPlaceDto;

  @ApiProperty()
  @IsString()
  expectStart!: string;

  @ApiProperty()
  @IsString()
  expectEnd!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  seatsNeeded!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @ApiPropertyOptional({ enum: Visibility, default: Visibility.PUBLIC })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
