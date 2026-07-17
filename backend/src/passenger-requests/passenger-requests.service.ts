import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TripStatus, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePassengerRequestDto } from './dto/create-passenger-request.dto';
import { ErrorCode } from '../common/constants/error-codes';
import { TencentMapService } from '../map/tencent-map.service';

@Injectable()
export class PassengerRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tencentMap: TencentMapService,
  ) {}

  async create(userId: string, dto: CreatePassengerRequestDto) {
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
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not owner' });
    }
    return this.prisma.passengerRequest.update({
      where: { id },
      data: { status: TripStatus.CANCELLED },
    });
  }
}
