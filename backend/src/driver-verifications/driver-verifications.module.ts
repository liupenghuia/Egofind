import { Module } from '@nestjs/common';
import { DriverVerificationsController } from './driver-verifications.controller';
import { DriverVerificationsService } from './driver-verifications.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [DriverVerificationsController],
  providers: [DriverVerificationsService],
  exports: [DriverVerificationsService],
})
export class DriverVerificationsModule {}
