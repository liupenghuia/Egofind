import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchStatus, Prisma, TripStatus, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  directionCosine,
  haversineKm,
  sameRegion,
  timeOverlapRatio,
} from '../common/utils/geo';
import { ErrorCode } from '../common/constants/error-codes';
import {
  evaluateCancelMatch,
  evaluateSeatDeduction,
  evaluateSeatRestore,
} from '../common/utils/trip-lifecycle';
import { expireStalePosts } from '../common/utils/expire-stale';
import { NotificationsService } from '../notifications/notifications.service';
import { TripFeedbacksService } from '../trip-feedbacks/trip-feedbacks.service';
import { UsersService } from '../users/users.service';
import { ReviewsService } from '../reviews/reviews.service';

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly tripFeedbacks: TripFeedbacksService,
    private readonly users: UsersService,
    private readonly reviews: ReviewsService,
  ) {}

  private scope(): 'county' | 'city' {
    const s = this.config.get<string>('MATCH_SCOPE') || 'county';
    return s === 'city' ? 'city' : 'county';
  }

  private dmax(): number {
    return Number(this.config.get('MATCH_DMAX_KM') || 15);
  }

  async forPassenger(requestId: string, userId: string) {
    await expireStalePosts(this.prisma);
    const req = await this.prisma.passengerRequest.findUnique({ where: { id: requestId } });
    if (!req) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: '人找车需求不存在' });
    }
    if (req.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: '只能查看自己的匹配候选' });
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

    const ratingMap = await this.reviews.summariesForUsers(
      scored.map((s) => s.trip.userId),
    );
    return scored.map((s) => {
      const summary = ratingMap.get(s.trip.userId) || {
        ratingAvg: null,
        ratingCount: 0,
      };
      return { ...s, ...summary };
    });
  }

  async forDriver(tripId: string, userId: string) {
    await expireStalePosts(this.prisma);
    await this.tripFeedbacks.assertDriverNotRestricted(userId, 'search');

    const trip = await this.prisma.driverTrip.findUnique({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: '车找人行程不存在' });
    }
    if (trip.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: '只能查看自己行程的候选' });
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
    const scored = requests
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

    const ratingMap = await this.reviews.summariesForUsers(
      scored.map((s) => s.request.userId),
    );
    return scored.map((s) => {
      const summary = ratingMap.get(s.request.userId) || {
        ratingAvg: null,
        ratingCount: 0,
      };
      return { ...s, ...summary };
    });
  }

  /** Only passenger can confirm ride-along */
  async confirm(passengerId: string, driverTripId: string, passengerRequestId: string) {
    await this.users.assertLegalAccepted(passengerId);
    await this.users.assertPhoneBound(passengerId);
    const [trip, req] = await Promise.all([
      this.prisma.driverTrip.findUnique({ where: { id: driverTripId } }),
      this.prisma.passengerRequest.findUnique({ where: { id: passengerRequestId } }),
    ]);
    if (!trip || !req) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: '行程或需求不存在',
      });
    }
    if (req.userId !== passengerId) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: '仅需求发布者可确认同行',
      });
    }
    if (trip.userId === passengerId) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: '不能与自己的行程确认同行',
      });
    }
    const seatPre = evaluateSeatDeduction(trip.seatsLeft, req.seatsNeeded);
    if (!seatPre.ok) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: seatPre.message,
      });
    }
    const open: TripStatus[] = [TripStatus.PUBLISHED, TripStatus.MATCHING];
    if (!open.includes(trip.status)) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: '行程当前不可确认',
      });
    }
    if (!open.includes(req.status)) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: '需求当前不可确认',
      });
    }

    const order = await this.prisma.$transaction(async (tx) => {
      // Conditional seat deduction: prevents concurrent oversell
      const deducted = await tx.driverTrip.updateMany({
        where: {
          id: trip.id,
          seatsLeft: { gte: req.seatsNeeded },
          status: { in: open },
        },
        data: {
          seatsLeft: { decrement: req.seatsNeeded },
        },
      });
      if (deducted.count !== 1) {
        throw new BadRequestException({
          code: ErrorCode.BAD_REQUEST,
          message: '余座不足或行程已不可确认',
        });
      }
      const fresh = await tx.driverTrip.findUnique({ where: { id: trip.id } });
      if (!fresh) {
        throw new NotFoundException({
          code: ErrorCode.NOT_FOUND,
          message: '行程不存在',
        });
      }
      await tx.driverTrip.update({
        where: { id: trip.id },
        data: {
          status:
            fresh.seatsLeft === 0 ? TripStatus.CONFIRMED : TripStatus.MATCHING,
        },
      });

      const reqLocked = await tx.passengerRequest.updateMany({
        where: {
          id: req.id,
          status: { in: open },
          userId: passengerId,
        },
        data: { status: TripStatus.CONFIRMED },
      });
      if (reqLocked.count !== 1) {
        throw new BadRequestException({
          code: ErrorCode.BAD_REQUEST,
          message: '需求当前不可确认',
        });
      }

      try {
        return await tx.matchOrder.create({
          data: {
            driverTripId,
            passengerRequestId,
            driverId: trip.userId,
            passengerId,
            seats: req.seatsNeeded,
            status: MatchStatus.CONFIRMED,
          },
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          throw new ConflictException({
            code: ErrorCode.CONFLICT,
            message: '已确认过该行程，请勿重复操作',
          });
        }
        throw e;
      }
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
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: '仅同行双方可完成行程',
      });
    }
    if (order.status === MatchStatus.COMPLETED) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: '行程已完成',
      });
    }
    if (order.status === MatchStatus.CANCELLED) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: '已取消的行程无法完成',
      });
    }
    if (order.status !== MatchStatus.CONFIRMED) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: '仅已确认同行的订单可标记完成',
      });
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const match = await tx.matchOrder.update({
        where: { id: matchId },
        data: { status: MatchStatus.COMPLETED, completedAt: new Date() },
      });
      // Cascade: passenger request done
      await tx.passengerRequest.updateMany({
        where: {
          id: order.passengerRequestId,
          status: { in: [TripStatus.CONFIRMED, TripStatus.MATCHING] },
        },
        data: { status: TripStatus.COMPLETED },
      });
      // Driver trip: if no seats left or already CONFIRMED, mark COMPLETED
      const trip = await tx.driverTrip.findUnique({
        where: { id: order.driverTripId },
      });
      if (trip && (trip.seatsLeft <= 0 || trip.status === TripStatus.CONFIRMED)) {
        await tx.driverTrip.update({
          where: { id: trip.id },
          data: { status: TripStatus.COMPLETED },
        });
      }
      return match;
    });
    const peerId =
      order.driverId === userId ? order.passengerId : order.driverId;
    await this.notifications.push(
      peerId,
      'MATCH_COMPLETED',
      '行程已完成',
      '对方已标记行程完成，可前往评价。',
      { matchOrderId: matchId },
    );
    await this.notifications.push(
      userId,
      'MATCH_COMPLETED',
      '行程已完成',
      '您已标记行程完成，可前往评价。',
      { matchOrderId: matchId },
    );
    return updated;
  }

  /**
   * Single-party cancel of CONFIRMED match (U4): restore seats & reopen passenger request.
   */
  async cancel(userId: string, matchId: string, reason?: string) {
    const order = await this.prisma.matchOrder.findUnique({
      where: { id: matchId },
    });
    if (!order) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: '匹配单不存在',
      });
    }
    if (order.driverId !== userId && order.passengerId !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: '仅同行双方可取消',
      });
    }
    const gate = evaluateCancelMatch(order.status);
    if (!gate.allowed) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: gate.message,
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const locked = await tx.matchOrder.updateMany({
        where: { id: matchId, status: MatchStatus.CONFIRMED },
        data: {
          status: MatchStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy: userId,
          cancelReason: reason?.trim()?.slice(0, 255) || null,
        },
      });
      if (locked.count !== 1) {
        throw new BadRequestException({
          code: ErrorCode.BAD_REQUEST,
          message: '当前状态不可取消同行',
        });
      }

      const trip = await tx.driverTrip.findUnique({
        where: { id: order.driverTripId },
      });
      if (trip) {
        const restored = evaluateSeatRestore(
          trip.seatsLeft,
          trip.seatsTotal,
          order.seats,
        );
        const tripOpen =
          trip.status === TripStatus.COMPLETED ||
          trip.status === TripStatus.CANCELLED ||
          trip.status === TripStatus.EXPIRED
            ? trip.status
            : restored.tripStatus;
        await tx.driverTrip.update({
          where: { id: trip.id },
          data: {
            seatsLeft: restored.seatsLeft,
            status: tripOpen,
          },
        });
      }

      await tx.passengerRequest.updateMany({
        where: {
          id: order.passengerRequestId,
          status: TripStatus.CONFIRMED,
        },
        data: { status: TripStatus.PUBLISHED },
      });

      return tx.matchOrder.findUniqueOrThrow({ where: { id: matchId } });
    });

    const peerId =
      order.driverId === userId ? order.passengerId : order.driverId;
    await this.notifications.push(
      peerId,
      'MATCH_CANCELLED',
      '同行已取消',
      '对方已取消本次确认同行，座位已释放。',
      { matchOrderId: matchId },
    );
    await this.notifications.push(
      userId,
      'MATCH_CANCELLED',
      '已取消同行',
      '您已取消本次确认同行。',
      { matchOrderId: matchId },
    );
    return updated;
  }

  async myMatches(userId: string) {
    const orders = await this.prisma.matchOrder.findMany({
      where: { OR: [{ driverId: userId }, { passengerId: userId }] },
      include: {
        driverTrip: true,
        passengerRequest: true,
        reviews: {
          select: {
            id: true,
            fromUserId: true,
            toUserId: true,
            rating: true,
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => {
      const myReview = o.reviews.find((r) => r.fromUserId === userId) || null;
      const peerReview = o.reviews.find((r) => r.fromUserId !== userId) || null;
      const { reviews, ...rest } = o;
      return {
        ...rest,
        myReview,
        peerReview,
        reviewedByMe: !!myReview,
      };
    });
  }
}
