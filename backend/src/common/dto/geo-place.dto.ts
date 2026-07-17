import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GeoPlaceDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @ApiProperty({ example: '130128' })
  @IsString()
  @MaxLength(12)
  adcode!: string;
}

export class TimeWindowDto {
  @ApiProperty()
  @IsString()
  start!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  end?: string;
}
