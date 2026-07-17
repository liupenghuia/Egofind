import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('wechat')
  @ApiOperation({ summary: '微信小程序登录（code → JWT）' })
  loginWechat(@Body() dto: WechatLoginDto) {
    return this.authService.loginWechat(dto);
  }

  @Public()
  @Post('admin/login')
  @ApiOperation({ summary: '管理后台账号密码登录' })
  loginAdmin(@Body() dto: AdminLoginDto) {
    return this.authService.loginAdmin(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '当前登录用户' })
  me(@CurrentUser() user: JwtPayloadUser) {
    return this.authService.getMe(user.id);
  }
}
