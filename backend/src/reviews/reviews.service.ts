import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
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
    if (!order || order.status !== MatchStatus.COMPLETED) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Match must be completed',
      });
    }
    if (order.driverId !== fromUserId && order.passengerId !== fromUserId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not participant' });
    }
    const toUserId = order.driverId === fromUserId ? order.passengerId : order.driverId;
    return this.prisma.review.create({
      data: {
        matchOrderId: data.matchOrderId,
        fromUserId,
        toUserId,
        rating: data.rating,
        tags: data.tags as object | undefined,
        content: data.content,
      },
    });
  }
}
