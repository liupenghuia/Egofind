import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DriverTripsService } from './driver-trips.service';
import { CreateDriverTripDto } from './dto/create-driver-trip.dto';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';

@ApiTags('driver-trips')
@ApiBearerAuth()
@Controller('driver-trips')
export class DriverTripsController {
  constructor(private readonly service: DriverTripsService) {}

  @Post()
  @ApiOperation({ summary: '发布车找人' })
  create(@CurrentUser() user: JwtPayloadUser, @Body() dto: CreateDriverTripDto) {
    return this.service.create(user.id, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: '我的车找人列表' })
  mine(@CurrentUser() user: JwtPayloadUser) {
    return this.service.mine(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '车找人详情（脱敏）' })
  one(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消车找人' })
  cancel(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.service.cancel(user.id, id);
  }
}
