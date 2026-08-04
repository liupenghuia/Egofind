import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { TripFeedbacksModule } from '../trip-feedbacks/trip-feedbacks.module';
import { UsersModule } from '../users/users.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [
    NotificationsModule,
    TripFeedbacksModule,
    UsersModule,
    ReviewsModule,
  ],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
