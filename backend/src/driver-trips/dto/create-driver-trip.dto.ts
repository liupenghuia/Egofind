import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GeoPlaceDto } from '../../common/dto/geo-place.dto';

export class CreateDriverTripDto {
  @ApiProperty({ type: GeoPlaceDto })
  @ValidateNested()
  @Type(() => GeoPlaceDto)
  origin!: GeoPlaceDto;

  @ApiProperty({ type: GeoPlaceDto })
  @ValidateNested()
  @Type(() => GeoPlaceDto)
  dest!: GeoPlaceDto;

  @ApiProperty({ description: 'ISO datetime window start' })
  @IsString()
  departStart!: string;

  @ApiProperty({ description: 'ISO datetime window end' })
  @IsString()
  departEnd!: string;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  seatsTotal!: number;

  @ApiPropertyOptional({ example: 1500, description: 'Cost share in cents' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;

  @ApiPropertyOptional({ description: 'Vehicle snapshot JSON' })
  @IsOptional()
  vehicleSnap?: Record<string, unknown>;
}
