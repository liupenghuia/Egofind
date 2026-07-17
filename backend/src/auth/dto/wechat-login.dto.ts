import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class WechatLoginDto {
  @ApiProperty({ description: 'wx.login 返回的 code', example: 'mock-code-001' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
