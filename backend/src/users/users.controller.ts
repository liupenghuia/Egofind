import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ActiveMode } from '@prisma/client';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleCode } from '../common/constants/roles';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SetModeDto {
  @ApiProperty({ enum: ActiveMode })
  @IsEnum(ActiveMode)
  mode!: ActiveMode;
}

class BindPhoneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  encryptedData?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iv?: string;

  @ApiPropertyOptional({ description: 'WECHAT_MOCK only' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: '用户列表（管理员）' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  list(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.usersService.listUsers(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Patch('me/mode')
  @ApiOperation({ summary: '切换乘客/司机模式偏好' })
  setMode(@CurrentUser() user: JwtPayloadUser, @Body() dto: SetModeDto) {
    return this.usersService.setMode(user.id, dto.mode);
  }

  @Post('phone/bind')
  @ApiOperation({ summary: '绑定手机号（微信授权 / mock）' })
  bindPhone(@CurrentUser() user: JwtPayloadUser, @Body() dto: BindPhoneDto) {
    return this.usersService.bindPhone(user.id, dto);
  }

  @Get('contact-phone/:matchOrderId')
  @ApiOperation({ summary: '乘客获取已确认同行的司机电话' })
  contactPhone(
    @CurrentUser() user: JwtPayloadUser,
    @Param('matchOrderId') matchOrderId: string,
  ) {
    return this.usersService.contactPhone(user.id, matchOrderId);
  }
}
