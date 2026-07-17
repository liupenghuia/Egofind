import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { DriverVerificationsModule } from '../driver-verifications/driver-verifications.module';
import { ReportsModule } from '../reports/reports.module';
import { TripFeedbacksModule } from '../trip-feedbacks/trip-feedbacks.module';

@Module({
  imports: [UsersModule, DriverVerificationsModule, ReportsModule, TripFeedbacksModule],
  controllers: [AdminController],
})
export class AdminModule {}
