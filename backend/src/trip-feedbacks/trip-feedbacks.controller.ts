import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TripFeedbacksService } from './trip-feedbacks.service';
import { CreateTripFeedbackDto } from './dto/create-trip-feedback.dto';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';

@ApiTags('trip-feedbacks')
@ApiBearerAuth()
@Controller('trip-feedbacks')
export class TripFeedbacksController {
  constructor(private readonly service: TripFeedbacksService) {}

  @Post()
  @ApiOperation({ summary: '乘客：无法同行反馈（司机原因/个人原因）' })
  create(@CurrentUser() user: JwtPayloadUser, @Body() dto: CreateTripFeedbackDto) {
    return this.service.create(user.id, dto);
  }

  @Get('me/driver-status')
  @ApiOperation({ summary: '当前用户作为司机的本月额度与是否受限' })
  driverStatus(@CurrentUser() user: JwtPayloadUser) {
    return this.service.getDriverStatus(user.id);
  }
}
