import { Module } from '@nestjs/common';
import { DriverTripsController } from './driver-trips.controller';
import { DriverTripsService } from './driver-trips.service';
import { MapModule } from '../map/map.module';

@Module({
  imports: [MapModule],
  controllers: [DriverTripsController],
  providers: [DriverTripsService],
  exports: [DriverTripsService],
})
export class DriverTripsModule {}
