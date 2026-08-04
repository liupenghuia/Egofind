import { Module } from '@nestjs/common';
import { DriverTripsController } from './driver-trips.controller';
import { DriverTripsService } from './driver-trips.service';
import { MapModule } from '../map/map.module';
import { TripFeedbacksModule } from '../trip-feedbacks/trip-feedbacks.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MapModule, TripFeedbacksModule, UsersModule],
  controllers: [DriverTripsController],
  providers: [DriverTripsService],
  exports: [DriverTripsService],
})
export class DriverTripsModule {}
