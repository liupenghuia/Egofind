import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchStatus, TripStatus, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  directionCosine,
  haversineKm,
  sameRegion,
  timeOverlapRatio,
} from '../common/utils/geo';
import { ErrorCode } from '../common/constants/error-codes';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  private scope(): 'county' | 'city' {
    const s = this.config.get<string>('MATCH_SCOPE') || 'county';
    return s === 'city' ? 'city' : 'county';
  }

  private dmax(): number {
    return Number(this.config.get('MATCH_DMAX_KM') || 15);
  }

  async forPassenger(requestId: string, userId: string) {
    const req = await this.prisma.passengerRequest.findUnique({ where: { id: requestId } });
    if (!req) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Request not found' });
    }
    if (req.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not owner' });
    }

    const now = new Date();
    const trips = await this.prisma.driverTrip.findMany({
      where: {
        status: { in: [TripStatus.PUBLISHED, TripStatus.MATCHING] },
        departEnd: { gt: now },
        seatsLeft: { gte: req.seatsNeeded },
        userId: { not: userId },
      },
      include: {
        user: { select: { id: true, nickname: true, avatar: true, phoneMask: true } },
      },
      take: 200,
    });

    const dmax = this.dmax();
    const scope = this.scope();
    const scored = trips
      .filter((t) => sameRegion(req.originAdcode, t.originAdcode, scope))
      .map((t) => {
        const timeScore = timeOverlapRatio(
          req.expectStart,
          req.expectEnd,
          t.departStart,
          t.departEnd,
        );
        if (timeScore <= 0) return null;
        const dist = haversineKm(req.originLat, req.originLng, t.originLat, t.originLng);
        const distScore = Math.max(0, 1 - dist / dmax);
        const cos = directionCosine(
          req.originLat,
          req.originLng,
          req.destLat,
          req.destLng,
          t.originLat,
          t.originLng,
          t.destLat,
          t.destLng,
        );
        const dirScore = (cos + 1) / 2;
        const score = 100 * (0.4 * timeScore + 0.35 * distScore + 0.25 * dirScore);
        return {
          score: Math.round(score * 10) / 10,
          distanceKm: Math.round(dist * 100) / 100,
          timeScore,
          distScore,
          dirScore,
          trip: t,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.score - a.score);

    return scored;
  }

  async forDriver(tripId: string, userId: string) {
    const trip = await this.prisma.driverTrip.findUnique({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Trip not found' });
    }
    if (trip.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not owner' });
    }

    const now = new Date();
    const requests = await this.prisma.passengerRequest.findMany({
      where: {
        status: { in: [TripStatus.PUBLISHED, TripStatus.MATCHING] },
        visibility: Visibility.PUBLIC,
        expectEnd: { gt: now },
        seatsNeeded: { lte: trip.seatsLeft },
        userId: { not: userId },
      },
      include: {
        user: { select: { id: true, nickname: true, avatar: true, phoneMask: true } },
      },
      take: 200,
    });

    const dmax = this.dmax();
    const scope = this.scope();
    return requests
      .filter((r) => sameRegion(trip.originAdcode, r.originAdcode, scope))
      .map((r) => {
        const timeScore = timeOverlapRatio(
          trip.departStart,
          trip.departEnd,
          r.expectStart,
          r.expectEnd,
        );
        if (timeScore <= 0) return null;
        const dist = haversineKm(trip.originLat, trip.originLng, r.originLat, r.originLng);
        const distScore = Math.max(0, 1 - dist / dmax);
        const cos = directionCosine(
          trip.originLat,
          trip.originLng,
          trip.destLat,
          trip.destLng,
          r.originLat,
          r.originLng,
          r.destLat,
          r.destLng,
        );
        const dirScore = (cos + 1) / 2;
        const score = 100 * (0.4 * timeScore + 0.35 * distScore + 0.25 * dirScore);
        return {
          score: Math.round(score * 10) / 10,
          distanceKm: Math.round(dist * 100) / 100,
          request: r,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.score - a.score);
  }

  /** Only passenger can confirm ride-along */
  async confirm(passengerId: string, driverTripId: string, passengerRequestId: string) {
    const [trip, req] = await Promise.all([
      this.prisma.driverTrip.findUnique({ where: { id: driverTripId } }),
      this.prisma.passengerRequest.findUnique({ where: { id: passengerRequestId } }),
    ]);
    if (!trip || !req) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Trip or request not found' });
    }
    if (req.userId !== passengerId) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Only passenger owner can confirm',
      });
    }
    if (trip.userId === passengerId) {
      throw new BadRequestException({ code: ErrorCode.BAD_REQUEST, message: 'Cannot match self' });
    }
    if (trip.seatsLeft < req.seatsNeeded) {
      throw new BadRequestException({ code: ErrorCode.BAD_REQUEST, message: 'Not enough seats' });
    }
    const open: TripStatus[] = [TripStatus.PUBLISHED, TripStatus.MATCHING];
    if (!open.includes(trip.status)) {
      throw new BadRequestException({ code: ErrorCode.BAD_REQUEST, message: 'Trip not open' });
    }
    if (!open.includes(req.status)) {
      throw new BadRequestException({ code: ErrorCode.BAD_REQUEST, message: 'Request not open' });
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.matchOrder.create({
        data: {
          driverTripId,
          passengerRequestId,
          driverId: trip.userId,
          passengerId,
          seats: req.seatsNeeded,
          status: MatchStatus.CONFIRMED,
        },
      });
      const seatsLeft = trip.seatsLeft - req.seatsNeeded;
      await tx.driverTrip.update({
        where: { id: trip.id },
        data: {
          seatsLeft,
          status: seatsLeft === 0 ? TripStatus.CONFIRMED : TripStatus.MATCHING,
        },
      });
      await tx.passengerRequest.update({
        where: { id: req.id },
        data: { status: TripStatus.CONFIRMED },
      });
      return created;
    });

    await this.notifications.push(
      trip.userId,
      'MATCH_CONFIRMED',
      '有乘客确认同行',
      '乘客已确认与您同行，请按时出发。',
      { matchOrderId: order.id },
    );
    await this.notifications.push(
      passengerId,
      'MATCH_CONFIRMED',
      '已确认同行',
      '您可以授权手机号后联系司机。',
      { matchOrderId: order.id },
    );

    return order;
  }

  async complete(userId: string, matchId: string) {
    const order = await this.prisma.matchOrder.findUnique({ where: { id: matchId } });
    if (!order) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Match not found' });
    }
    if (order.driverId !== userId && order.passengerId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not participant' });
    }
    return this.prisma.matchOrder.update({
      where: { id: matchId },
      data: { status: MatchStatus.COMPLETED, completedAt: new Date() },
    });
  }

  async myMatches(userId: string) {
    return this.prisma.matchOrder.findMany({
      where: { OR: [{ driverId: userId }, { passengerId: userId }] },
      include: {
        driverTrip: true,
        passengerRequest: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
