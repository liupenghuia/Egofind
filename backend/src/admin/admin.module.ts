import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { DriverVerificationsModule } from '../driver-verifications/driver-verifications.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [UsersModule, DriverVerificationsModule, ReportsModule],
  controllers: [AdminController],
})
export class AdminModule {}
