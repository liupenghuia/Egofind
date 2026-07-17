import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleCode } from '../common/constants/roles';
import { UsersService } from '../users/users.service';
import { DriverVerificationsService } from '../driver-verifications/driver-verifications.service';
import { ReportsService } from '../reports/reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { TripFeedbacksService } from '../trip-feedbacks/trip-feedbacks.service';
import { CurrentUser, JwtPayloadUser } from '../common/decorators/current-user.decorator';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ReviewDto {
  @ApiProperty()
  @IsBoolean()
  approve!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectReason?: string;
}

class SetStatusDto {
  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsInt()
  status!: number;
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles(RoleCode.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly users: UsersService,
    private readonly verifications: DriverVerificationsService,
    private readonly reports: ReportsService,
    private readonly prisma: PrismaService,
    private readonly tripFeedbacks: TripFeedbacksService,
  ) {}

  @Get('stats/by-adcode')
  @ApiOperation({ summary: '按区县统计行程与需求' })
  async statsByAdcode() {
    const trips = await this.prisma.driverTrip.groupBy({
      by: ['originAdcode'],
      _count: { id: true },
    });
    const reqs = await this.prisma.passengerRequest.groupBy({
      by: ['originAdcode'],
      _count: { id: true },
    });
    const matches = await this.prisma.matchOrder.count();
    return { driverTrips: trips, passengerRequests: reqs, matchOrders: matches };
  }

  @Get('driver-verifications')
  @ApiOperation({ summary: '待审司机认证' })
  listVerifications() {
    return this.verifications.listPending();
  }

  @Post('driver-verifications/:id/review')
  @ApiOperation({ summary: '审核司机认证' })
  review(
    @CurrentUser() admin: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: ReviewDto,
  ) {
    return this.verifications.review(admin.id, id, dto.approve, dto.rejectReason);
  }

  @Get('reports')
  @ApiOperation({ summary: '举报列表' })
  reportsList() {
    return this.reports.listOpen();
  }

  @Get('orders/driver-trips')
  @ApiOperation({ summary: '管理：车找人列表' })
  driverTrips(@Query('adcode') adcode?: string) {
    return this.prisma.driverTrip.findMany({
      where: adcode ? { originAdcode: adcode } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Get('orders/passenger-requests')
  @ApiOperation({ summary: '管理：人找车列表' })
  passengerRequests(@Query('adcode') adcode?: string) {
    return this.prisma.passengerRequest.findMany({
      where: adcode ? { originAdcode: adcode } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Get('orders/matches')
  @ApiOperation({ summary: '管理：匹配单列表' })
  matches() {
    return this.prisma.matchOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { driverTrip: true, passengerRequest: true },
    });
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: '禁用/启用用户' })
  setUserStatus(
    @CurrentUser() admin: JwtPayloadUser,
    @Param('id') id: string,
    @Body() dto: SetStatusDto,
  ) {
    return this.users.setStatus(admin.id, id, dto.status);
  }

  @Get('trip-feedbacks')
  @ApiOperation({ summary: '无法同行反馈列表 + 本月司机原因聚合' })
  listTripFeedbacks(
    @Query('yearMonth') yearMonth?: string,
    @Query('driverId') driverId?: string,
  ) {
    return this.tripFeedbacks.listForAdmin({ yearMonth, driverId });
  }

  @Get('map/preview')
  @ApiOperation({ summary: '后台地图预览点位' })
  async mapPreview(@Query('adcode') adcode?: string) {
    const [trips, reqs] = await Promise.all([
      this.prisma.driverTrip.findMany({
        where: adcode ? { originAdcode: adcode } : undefined,
        take: 100,
      }),
      this.prisma.passengerRequest.findMany({
        where: {
          ...(adcode ? { originAdcode: adcode } : {}),
          visibility: 'PUBLIC',
        },
        take: 100,
      }),
    ]);
    return {
      drivers: trips.map((t) => ({
        id: t.id,
        lat: t.originLat,
        lng: t.originLng,
        title: t.originName,
        type: 'driver_trip',
      })),
      passengers: reqs.map((r) => ({
        id: r.id,
        lat: r.originLat,
        lng: r.originLng,
        title: r.originName,
        type: 'passenger_request',
      })),
    };
  }
}
