import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReportStatus, ReportTargetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/constants/error-codes';

const REASON_CODES = new Set([
  'harassment',
  'fraud',
  'safety',
  'abuse',
  'other',
]);

const MAX_REPORTS_PER_DAY = 20;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    reporterId: string,
    data: {
      targetType: ReportTargetType;
      targetId: string;
      /** Ignored — server resolves only */
      targetUserId?: string;
      reasonCode: string;
      detail?: string;
    },
  ) {
    if (!data.targetId?.trim()) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: '缺少举报目标',
      });
    }
    if (!REASON_CODES.has(data.reasonCode)) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: '请选择有效的举报原因',
      });
    }

    const targetId = data.targetId.trim();
    const targetUserId = await this.resolveTargetUserId(
      data.targetType,
      targetId,
      reporterId,
    );

    if (targetUserId === reporterId) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: '不能举报自己',
      });
    }

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayCount = await this.prisma.report.count({
      where: { reporterId, createdAt: { gte: dayStart } },
    });
    if (dayCount >= MAX_REPORTS_PER_DAY) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: '今日举报次数已达上限，请明日再试',
      });
    }

    const openDup = await this.prisma.report.findFirst({
      where: {
        reporterId,
        targetType: data.targetType,
        targetId,
        status: { in: [ReportStatus.OPEN, ReportStatus.REVIEWING] },
      },
    });
    if (openDup) {
      throw new ConflictException({
        code: ErrorCode.CONFLICT,
        message: '您已提交过针对该目标的举报，请等待处理',
      });
    }

    return this.prisma.report.create({
      data: {
        reporterId,
        targetType: data.targetType,
        targetId,
        targetUserId,
        reasonCode: data.reasonCode,
        detail: data.detail?.trim()?.slice(0, 1000) || undefined,
        status: ReportStatus.OPEN,
      },
    });
  }

  /**
   * Server-only resolution. Client-supplied targetUserId is never trusted.
   */
  private async resolveTargetUserId(
    type: ReportTargetType,
    targetId: string,
    reporterId: string,
  ): Promise<string | undefined> {
    if (type === ReportTargetType.USER) {
      const u = await this.prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!u) {
        throw new NotFoundException({
          code: ErrorCode.NOT_FOUND,
          message: '被举报用户不存在',
        });
      }
      return u.id;
    }
    if (type === ReportTargetType.DRIVER_TRIP) {
      const t = await this.prisma.driverTrip.findUnique({
        where: { id: targetId },
        select: { userId: true },
      });
      if (!t) {
        throw new NotFoundException({
          code: ErrorCode.NOT_FOUND,
          message: '被举报行程不存在',
        });
      }
      return t.userId;
    }
    if (type === ReportTargetType.PASSENGER_REQUEST) {
      const r = await this.prisma.passengerRequest.findUnique({
        where: { id: targetId },
        select: { userId: true },
      });
      if (!r) {
        throw new NotFoundException({
          code: ErrorCode.NOT_FOUND,
          message: '被举报需求不存在',
        });
      }
      return r.userId;
    }
    if (type === ReportTargetType.MATCH) {
      const m = await this.prisma.matchOrder.findUnique({
        where: { id: targetId },
        select: { driverId: true, passengerId: true },
      });
      if (!m) {
        throw new NotFoundException({
          code: ErrorCode.NOT_FOUND,
          message: '被举报匹配单不存在',
        });
      }
      if (m.passengerId === reporterId) return m.driverId;
      if (m.driverId === reporterId) return m.passengerId;
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: '仅匹配双方可举报该订单',
      });
    }
    throw new BadRequestException({
      code: ErrorCode.BAD_REQUEST,
      message: '无效的举报类型',
    });
  }

  listOpen() {
    return this.prisma.report.findMany({
      where: { status: { in: [ReportStatus.OPEN, ReportStatus.REVIEWING] } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        reporter: {
          select: { id: true, nickname: true, phoneMask: true },
        },
        targetUser: {
          select: { id: true, nickname: true, phoneMask: true, status: true },
        },
      },
    });
  }

  async resolve(
    adminId: string,
    reportId: string,
    data: {
      status: 'REVIEWING' | 'CLOSED';
      adminNote?: string;
      banTargetUser?: boolean;
    },
  ) {
    const row = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!row) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: '举报不存在',
      });
    }
    if (row.status === ReportStatus.CLOSED) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: '该举报已关闭',
      });
    }

    const nextStatus =
      data.status === 'REVIEWING' ? ReportStatus.REVIEWING : ReportStatus.CLOSED;
    const note = data.adminNote?.trim()?.slice(0, 1000);

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: nextStatus,
        adminNote: note || row.adminNote,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    if (
      data.banTargetUser &&
      row.targetUserId &&
      nextStatus === ReportStatus.CLOSED
    ) {
      await this.prisma.user.update({
        where: { id: row.targetUserId },
        data: { status: 0 },
      });
    }

    return updated;
  }
}
