import { Module } from '@nestjs/common';
import { PassengerRequestsController } from './passenger-requests.controller';
import { PassengerRequestsService } from './passenger-requests.service';
import { MapModule } from '../map/map.module';

@Module({
  imports: [MapModule],
  controllers: [PassengerRequestsController],
  providers: [PassengerRequestsService],
  exports: [PassengerRequestsService],
})
export class PassengerRequestsModule {}
