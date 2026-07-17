import { Injectable } from '@nestjs/common';
import { ReportTargetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    reporterId: string,
    data: {
      targetType: ReportTargetType;
      targetId: string;
      targetUserId?: string;
      reasonCode: string;
      detail?: string;
    },
  ) {
    return this.prisma.report.create({
      data: {
        reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        targetUserId: data.targetUserId,
        reasonCode: data.reasonCode,
        detail: data.detail,
      },
    });
  }

  listOpen() {
    return this.prisma.report.findMany({
      where: { status: { in: ['OPEN', 'REVIEWING'] } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
