import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DriverVerificationsService } from './driver-verifications.service';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';

@ApiTags('driver-verifications')
@ApiBearerAuth()
@Controller('driver-verifications')
export class DriverVerificationsController {
  constructor(private readonly service: DriverVerificationsService) {}

  @Post()
  @ApiOperation({ summary: '提交司机认证' })
  submit(@CurrentUser() user: JwtPayloadUser, @Body() dto: SubmitVerificationDto) {
    return this.service.submit(user.id, dto);
  }
}
