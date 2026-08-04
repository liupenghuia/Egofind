import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './config/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { DriverTripsModule } from './driver-trips/driver-trips.module';
import { PassengerRequestsModule } from './passenger-requests/passenger-requests.module';
import { MatchingModule } from './matching/matching.module';
import { MapModule } from './map/map.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { ReviewsModule } from './reviews/reviews.module';
import { DriverVerificationsModule } from './driver-verifications/driver-verifications.module';
import { AdminModule } from './admin/admin.module';
import { TripFeedbacksModule } from './trip-feedbacks/trip-feedbacks.module';
import { UploadsModule } from './uploads/uploads.module';
import { HealthController } from './health/health.controller';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    RolesModule,
    DriverTripsModule,
    PassengerRequestsModule,
    MatchingModule,
    MapModule,
    NotificationsModule,
    ReportsModule,
    ReviewsModule,
    DriverVerificationsModule,
    TripFeedbacksModule,
    UploadsModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
