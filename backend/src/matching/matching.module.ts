import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { TripFeedbacksModule } from '../trip-feedbacks/trip-feedbacks.module';

@Module({
  imports: [NotificationsModule, TripFeedbacksModule],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
