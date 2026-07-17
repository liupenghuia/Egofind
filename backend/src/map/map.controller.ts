import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MapService } from './map.service';

@ApiTags('map')
@ApiBearerAuth()
@Controller('map')
export class MapController {
  constructor(private readonly service: MapService) {}

  @Get('markers')
  @ApiOperation({ summary: '地图标记（按模式返回对方供给）' })
  @ApiQuery({ name: 'mode', enum: ['passenger', 'driver'] })
  @ApiQuery({ name: 'adcode', required: false })
  @ApiQuery({ name: 'minLat', required: false })
  @ApiQuery({ name: 'maxLat', required: false })
  @ApiQuery({ name: 'minLng', required: false })
  @ApiQuery({ name: 'maxLng', required: false })
  markers(
    @Query('mode') mode: 'passenger' | 'driver' = 'passenger',
    @Query('adcode') adcode?: string,
    @Query('minLat') minLat?: string,
    @Query('maxLat') maxLat?: string,
    @Query('minLng') minLng?: string,
    @Query('maxLng') maxLng?: string,
  ) {
    return this.service.markers({
      mode: mode === 'driver' ? 'driver' : 'passenger',
      adcode,
      minLat: minLat != null ? Number(minLat) : undefined,
      maxLat: maxLat != null ? Number(maxLat) : undefined,
      minLng: minLng != null ? Number(minLng) : undefined,
      maxLng: maxLng != null ? Number(maxLng) : undefined,
    });
  }
}
