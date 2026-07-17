import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '通知列表' })
  list(@CurrentUser() user: JwtPayloadUser) {
    return this.service.list(user.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: '标记已读' })
  read(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.service.markRead(user.id, id);
  }
}
