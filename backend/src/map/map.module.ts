import { Module } from '@nestjs/common';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { TencentMapService } from './tencent-map.service';

@Module({
  controllers: [MapController],
  providers: [MapService, TencentMapService],
  exports: [TencentMapService, MapService],
})
export class MapModule {}
