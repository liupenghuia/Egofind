import { Module } from '@nestjs/common';
import { DriverVerificationsController } from './driver-verifications.controller';
import { DriverVerificationsService } from './driver-verifications.service';

@Module({
  controllers: [DriverVerificationsController],
  providers: [DriverVerificationsService],
  exports: [DriverVerificationsService],
})
export class DriverVerificationsModule {}
