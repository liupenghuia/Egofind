import { Module } from '@nestjs/common';
import { PassengerRequestsController } from './passenger-requests.controller';
import { PassengerRequestsService } from './passenger-requests.service';

@Module({
  controllers: [PassengerRequestsController],
  providers: [PassengerRequestsService],
  exports: [PassengerRequestsService],
})
export class PassengerRequestsModule {}
