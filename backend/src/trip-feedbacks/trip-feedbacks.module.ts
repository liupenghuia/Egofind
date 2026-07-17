import { Module } from '@nestjs/common';
import { TripFeedbacksController } from './trip-feedbacks.controller';
import { TripFeedbacksService } from './trip-feedbacks.service';

@Module({
  controllers: [TripFeedbacksController],
  providers: [TripFeedbacksService],
  exports: [TripFeedbacksService],
})
export class TripFeedbacksModule {}
