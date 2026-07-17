import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MapService } from './map.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('map')
@ApiBearerAuth()
@Controller('map')
export class MapController {
  constructor(private readonly service: MapService) {}

  @Get('status')
  @Public()
  @ApiOperation({ summary: '地图服务配置状态（是否配置腾讯 Key）' })
  status() {
    return this.service.status();
  }

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

  @Public()
  @Get('reverse-geocode')
  @ApiOperation({
    summary: '腾讯逆地理：坐标 → adcode/地址（无 Key 时返回 mock）',
  })
  @ApiQuery({ name: 'lat', required: true, example: 38.184 })
  @ApiQuery({ name: 'lng', required: true, example: 115.201 })
  reverse(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    return this.service.reverseGeocode(
      lat != null ? Number(lat) : undefined,
      lng != null ? Number(lng) : undefined,
    );
  }

  @Get('geocode')
  @ApiOperation({ summary: '地址解析：文字地址 → 坐标 + adcode' })
  @ApiQuery({ name: 'address', required: true })
  geocode(@Query('address') address?: string) {
    return this.service.geocode(address);
  }
}
