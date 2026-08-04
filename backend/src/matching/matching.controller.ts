import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { ConfirmMatchDto } from './dto/confirm-match.dto';
import { CancelMatchDto } from './dto/cancel-match.dto';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';

@ApiTags('matching')
@ApiBearerAuth()
@Controller('matching')
export class MatchingController {
  constructor(private readonly service: MatchingService) {}

  @Get('mine')
  @ApiOperation({ summary: '我的匹配单' })
  mine(@CurrentUser() user: JwtPayloadUser) {
    return this.service.myMatches(user.id);
  }

  @Get('for-passenger/:requestId')
  @ApiOperation({ summary: '乘客侧：匹配候选司机行程' })
  forPassenger(@CurrentUser() user: JwtPayloadUser, @Param('requestId') requestId: string) {
    return this.service.forPassenger(requestId, user.id);
  }

  @Get('for-driver/:tripId')
  @ApiOperation({ summary: '司机侧：匹配候选人找车（只读）' })
  forDriver(@CurrentUser() user: JwtPayloadUser, @Param('tripId') tripId: string) {
    return this.service.forDriver(tripId, user.id);
  }

  @Post('confirm')
  @ApiOperation({ summary: '乘客确认同行（仅乘客）' })
  confirm(@CurrentUser() user: JwtPayloadUser, @Body() dto: ConfirmMatchDto) {
    return this.service.confirm(user.id, dto.driverTripId, dto.passengerRequestId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成同行单' })
  complete(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.service.complete(user.id, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消已确认同行（双方，单方生效）' })
  cancel(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: CancelMatchDto,
  ) {
    return this.service.cancel(user.id, id, dto?.reason);
  }
}
