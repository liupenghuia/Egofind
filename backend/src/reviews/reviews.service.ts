import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MatchStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    fromUserId: string,
    data: { matchOrderId: string; rating: number; tags?: string[]; content?: string },
  ) {
    const order = await this.prisma.matchOrder.findUnique({
      where: { id: data.matchOrderId },
    });
    if (!order) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: '匹配单不存在',
      });
    }
    if (order.status !== MatchStatus.COMPLETED) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: '行程完成后才能评价',
      });
    }
    if (order.driverId !== fromUserId && order.passengerId !== fromUserId) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: '仅同行双方可评价',
      });
    }
    const toUserId = order.driverId === fromUserId ? order.passengerId : order.driverId;
    try {
      return await this.prisma.review.create({
        data: {
          matchOrderId: data.matchOrderId,
          fromUserId,
          toUserId,
          rating: data.rating,
          tags: data.tags as object | undefined,
          content: data.content,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException({
          code: ErrorCode.CONFLICT,
          message: '您已评价过该行程',
        });
      }
      throw e;
    }
  }

  /** Aggregate received ratings for candidate list (U4). */
  async summariesForUsers(
    userIds: string[],
  ): Promise<Map<string, { ratingAvg: number | null; ratingCount: number }>> {
    const uniq = [...new Set(userIds.filter(Boolean))];
    const map = new Map<string, { ratingAvg: number | null; ratingCount: number }>();
    for (const id of uniq) {
      map.set(id, { ratingAvg: null, ratingCount: 0 });
    }
    if (!uniq.length) return map;

    const rows = await this.prisma.review.groupBy({
      by: ['toUserId'],
      where: { toUserId: { in: uniq } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    for (const row of rows) {
      const avg = row._avg.rating;
      map.set(row.toUserId, {
        ratingAvg:
          avg == null ? null : Math.round(Number(avg) * 10) / 10,
        ratingCount: row._count._all,
      });
    }
    return map;
  }

  async listByMatch(userId: string, matchOrderId: string) {
    const order = await this.prisma.matchOrder.findUnique({
      where: { id: matchOrderId },
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
        message: '仅同行双方可查看评价',
      });
    }
    return this.prisma.review.findMany({
      where: { matchOrderId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        fromUserId: true,
        toUserId: true,
        rating: true,
        content: true,
        tags: true,
        createdAt: true,
      },
    });
  }
}
