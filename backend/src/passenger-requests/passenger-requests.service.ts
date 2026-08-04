import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MatchStatus, TripStatus, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePassengerRequestDto } from './dto/create-passenger-request.dto';
import { ErrorCode } from '../common/constants/error-codes';
import { TencentMapService } from '../map/tencent-map.service';
import {
  ACTIVE_MATCH_STATUSES,
  evaluateCancelPublish,
} from '../common/utils/trip-lifecycle';
import { UsersService } from '../users/users.service';

@Injectable()
export class PassengerRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tencentMap: TencentMapService,
    private readonly users: UsersService,
  ) {}

  async create(userId: string, dto: CreatePassengerRequestDto) {
    await this.users.assertLegalAccepted(userId);
    await this.users.assertPhoneBound(userId);
    const start = new Date(dto.expectStart);
    const end = new Date(dto.expectEnd);
    if (!(start < end)) {
      throw new ForbiddenException({
        code: ErrorCode.BAD_REQUEST,
        message: 'expectEnd must be after expectStart',
      });
    }

    const [origin, dest] = await Promise.all([
      this.tencentMap.enrichPlace(dto.origin),
      this.tencentMap.enrichPlace(dto.dest),
    ]);

    return this.prisma.passengerRequest.create({
      data: {
        userId,
        originName: origin.name,
        originLat: origin.lat,
        originLng: origin.lng,
        originAdcode: origin.adcode,
        destName: dest.name,
        destLat: dest.lat,
        destLng: dest.lng,
        destAdcode: dest.adcode,
        expectStart: start,
        expectEnd: end,
        seatsNeeded: dto.seatsNeeded,
        remark: dto.remark,
        visibility: dto.visibility ?? Visibility.PUBLIC,
        status: TripStatus.MATCHING,
      },
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.passengerRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, nickname: true, avatar: true, phoneMask: true },
        },
      },
    });
    if (!row) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Request not found' });
    }
    return row;
  }

  async mine(userId: string) {
    return this.prisma.passengerRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setVisibility(userId: string, id: string, visibility: Visibility) {
    const row = await this.findOne(id);
    if (row.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not owner' });
    }
    return this.prisma.passengerRequest.update({
      where: { id },
      data: { visibility },
    });
  }

  async cancel(userId: string, id: string) {
    const row = await this.findOne(id);
    if (row.userId !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: '只能取消自己的需求',
      });
    }
    const activeMatchCount = await this.prisma.matchOrder.count({
      where: {
        passengerRequestId: id,
        status: { in: [...ACTIVE_MATCH_STATUSES] as MatchStatus[] },
      },
    });
    const decision = evaluateCancelPublish(row.status, activeMatchCount);
    if (!decision.allowed) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: decision.message,
      });
    }
    return this.prisma.passengerRequest.update({
      where: { id },
      data: { status: TripStatus.CANCELLED },
    });
  }
}
