import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TripStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverTripDto } from './dto/create-driver-trip.dto';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class DriverTripsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateDriverTripDto) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId } });
    // Allow publish if approved OR no strict gate in dev; still attach vehicle snap
    const vehicleSnap =
      dto.vehicleSnap ||
      (profile
        ? {
            plateNo: profile.plateNo,
            carModel: profile.carModel,
            carColor: profile.carColor,
          }
        : undefined);

    const start = new Date(dto.departStart);
    const end = new Date(dto.departEnd);
    if (!(start < end)) {
      throw new ForbiddenException({
        code: ErrorCode.BAD_REQUEST,
        message: 'departEnd must be after departStart',
      });
    }

    return this.prisma.driverTrip.create({
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
        departStart: start,
        departEnd: end,
        seatsTotal: dto.seatsTotal,
        seatsLeft: dto.seatsTotal,
        priceCents: dto.priceCents ?? 0,
        remark: dto.remark,
        vehicleSnap: vehicleSnap as object | undefined,
        status: TripStatus.MATCHING,
      },
    });
  }

  async findOne(id: string) {
    const trip = await this.prisma.driverTrip.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            phoneMask: true,
            driverProfile: true,
          },
        },
      },
    });
    if (!trip) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Trip not found' });
    }
    return trip;
  }

  async mine(userId: string) {
    return this.prisma.driverTrip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(userId: string, id: string) {
    const trip = await this.findOne(id);
    if (trip.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not owner' });
    }
    return this.prisma.driverTrip.update({
      where: { id },
      data: { status: TripStatus.CANCELLED },
    });
  }
}
