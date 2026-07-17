import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TripStatus, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePassengerRequestDto } from './dto/create-passenger-request.dto';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class PassengerRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePassengerRequestDto) {
    const start = new Date(dto.expectStart);
    const end = new Date(dto.expectEnd);
    if (!(start < end)) {
      throw new ForbiddenException({
        code: ErrorCode.BAD_REQUEST,
        message: 'expectEnd must be after expectStart',
      });
    }

    return this.prisma.passengerRequest.create({
      data: {
        userId,
        originName: dto.origin.name,
        originLat: dto.origin.lat,
        originLng: dto.origin.lng,
        originAdcode: dto.origin.adcode,
        destName: dto.dest.name,
        destLat: dto.dest.lat,
        destLng: dto.dest.lng,
        destAdcode: dto.dest.adcode,
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
