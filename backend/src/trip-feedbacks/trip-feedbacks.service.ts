import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TripFeedbackReason, TripStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/constants/error-codes';
import {
  currentYearMonthShanghai,
  nextMonthFirstLabelShanghai,
} from '../common/utils/year-month';

export type DriverQuotaStatus = {
  yearMonth: string;
  driverReasonCount: number;
  limit: number;
  remaining: number;
  restricted: boolean;
  message: string;
  resetHint: string;
};

@Injectable()
export class TripFeedbacksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  monthlyLimit(): number {
    const n = Number(this.config.get('DRIVER_REASON_MONTHLY_LIMIT') || 10);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 10;
  }

  async getDriverStatus(driverId: string): Promise<DriverQuotaStatus> {
    const yearMonth = currentYearMonthShanghai();
    const limit = this.monthlyLimit();
    const driverReasonCount = await this.prisma.tripFeedback.count({
      where: {
        driverId,
        yearMonth,
        reason: TripFeedbackReason.DRIVER_REASON,
      },
    });
    const remaining = Math.max(0, limit - driverReasonCount);
    const restricted = driverReasonCount >= limit;
    const resetHint = nextMonthFirstLabelShanghai();
    const message = restricted
      ? `本月因乘客反馈「司机原因」已达 ${limit} 次，已限制发布行程与查找乘客，${resetHint} 恢复额度（已用 ${driverReasonCount}/${limit}）`
      : `本月「司机原因」反馈 ${driverReasonCount}/${limit}，剩余 ${remaining} 次`;
    return {
      yearMonth,
      driverReasonCount,
      limit,
      remaining,
      restricted,
      message,
      resetHint,
    };
  }

  /**
   * 发车 / 搜乘客前调用。action 决定错误码文案。
   */
  async assertDriverNotRestricted(
    driverId: string,
    action: 'publish' | 'search' = 'publish',
  ): Promise<DriverQuotaStatus> {
    const status = await this.getDriverStatus(driverId);
    if (!status.restricted) return status;
    const code =
      action === 'search'
        ? ErrorCode.DRIVER_RESTRICTED_SEARCH
        : ErrorCode.DRIVER_RESTRICTED_PUBLISH;
    throw new ForbiddenException({
      code,
      message: status.message,
      data: status,
    });
  }

  async create(
    passengerId: string,
    body: { driverTripId: string; reason: TripFeedbackReason; remark?: string },
  ) {
    const trip = await this.prisma.driverTrip.findUnique({
      where: { id: body.driverTripId },
    });
    if (!trip) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: '行程不存在',
      });
    }
    if (trip.userId === passengerId) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: '不能对自己的行程反馈',
      });
    }

    const yearMonth = currentYearMonthShanghai();
    try {
      const row = await this.prisma.tripFeedback.create({
        data: {
          driverTripId: trip.id,
          driverId: trip.userId,
          passengerId,
          reason: body.reason,
          remark: body.remark?.slice(0, 100),
          yearMonth,
        },
      });
      const status = await this.getDriverStatus(trip.userId);
      return { feedback: row, driverStatus: status };
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'P2002') {
        throw new ConflictException({
          code: ErrorCode.FEEDBACK_DUPLICATE,
          message: '您已对该行程提交过反馈',
        });
      }
      throw e;
    }
  }

  async listForAdmin(params?: { yearMonth?: string; driverId?: string }) {
    const yearMonth = params?.yearMonth || currentYearMonthShanghai();
    const items = await this.prisma.tripFeedback.findMany({
      where: {
        yearMonth,
        ...(params?.driverId ? { driverId: params.driverId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        driver: { select: { id: true, nickname: true, phoneMask: true } },
        passenger: { select: { id: true, nickname: true } },
        driverTrip: {
          select: {
            id: true,
            originName: true,
            destName: true,
            seatsLeft: true,
          },
        },
      },
    });

    const byDriver = await this.prisma.tripFeedback.groupBy({
      by: ['driverId'],
      where: {
        yearMonth,
        reason: TripFeedbackReason.DRIVER_REASON,
      },
      _count: { id: true },
    });

    return {
      yearMonth,
      limit: this.monthlyLimit(),
      items,
      driverReasonAgg: byDriver.map((g) => ({
        driverId: g.driverId,
        driverReasonCount: g._count.id,
        restricted: g._count.id >= this.monthlyLimit(),
      })),
    };
  }
}

/** 行程是否仍开放接客（详情展示用） */
export function tripAcceptMeta(trip: {
  seatsLeft: number;
  seatsTotal: number;
  status: TripStatus;
  departEnd: Date;
}) {
  const openStatus =
    trip.status === TripStatus.PUBLISHED || trip.status === TripStatus.MATCHING;
  const notExpired = trip.departEnd.getTime() > Date.now();
  const isFull = trip.seatsLeft <= 0;
  const canAcceptPassenger = openStatus && notExpired && !isFull;
  return {
    seatsLeft: trip.seatsLeft,
    seatsTotal: trip.seatsTotal,
    isFull,
    canAcceptPassenger,
    status: trip.status,
  };
}
