import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PassengerRequestsService } from './passenger-requests.service';
import { CreatePassengerRequestDto } from './dto/create-passenger-request.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';

@ApiTags('passenger-requests')
@ApiBearerAuth()
@Controller('passenger-requests')
export class PassengerRequestsController {
  constructor(private readonly service: PassengerRequestsService) {}

  @Post()
  @ApiOperation({ summary: '发布人找车' })
  create(@CurrentUser() user: JwtPayloadUser, @Body() dto: CreatePassengerRequestDto) {
    return this.service.create(user.id, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: '我的人找车列表' })
  mine(@CurrentUser() user: JwtPayloadUser) {
    return this.service.mine(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '人找车详情' })
  one(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/visibility')
  @ApiOperation({ summary: '切换公开/隐藏' })
  visibility(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: UpdateVisibilityDto,
  ) {
    return this.service.setVisibility(user.id, id, dto.visibility);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消人找车' })
  cancel(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.service.cancel(user.id, id);
  }
}
