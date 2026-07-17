import { Module } from '@nestjs/common';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { TencentMapService } from './tencent-map.service';
import { TripFeedbacksModule } from '../trip-feedbacks/trip-feedbacks.module';

@Module({
  imports: [TripFeedbacksModule],
  controllers: [MapController],
  providers: [MapService, TencentMapService],
  exports: [TencentMapService, MapService],
})
export class MapModule {}
