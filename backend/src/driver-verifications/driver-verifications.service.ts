import { BadRequestException, Injectable } from '@nestjs/common';
import { VerifyStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/constants/error-codes';
import { RoleCode } from '../common/constants/roles';

@Injectable()
export class DriverVerificationsService {
  constructor(private readonly prisma: PrismaService) {}

  submit(
    userId: string,
    data: {
      realName?: string;
      idCardMask?: string;
      licenseImg?: string;
      vehicleImg?: string;
      plateNo?: string;
      carModel?: string;
      carColor?: string;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.driverProfile.upsert({
        where: { userId },
        update: {
          plateNo: data.plateNo,
          carModel: data.carModel,
          carColor: data.carColor,
          verifyStatus: VerifyStatus.PENDING,
        },
        create: {
          userId,
          plateNo: data.plateNo,
          carModel: data.carModel,
          carColor: data.carColor,
          verifyStatus: VerifyStatus.PENDING,
        },
      });
      return tx.driverVerification.create({
        data: {
          userId,
          ...data,
          status: VerifyStatus.PENDING,
        },
      });
    });
  }

  listPending() {
    return this.prisma.driverVerification.findMany({
      where: { status: VerifyStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, nickname: true, openid: true } } },
    });
  }

  async review(adminId: string, id: string, approve: boolean, rejectReason?: string) {
    const row = await this.prisma.driverVerification.findUnique({ where: { id } });
    if (!row || row.status !== VerifyStatus.PENDING) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Invalid verification',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.driverVerification.update({
        where: { id },
        data: {
          status: approve ? VerifyStatus.APPROVED : VerifyStatus.REJECTED,
          rejectReason: approve ? null : rejectReason || 'rejected',
          reviewedAt: new Date(),
          reviewerId: adminId,
        },
      });

      await tx.driverProfile.upsert({
        where: { userId: row.userId },
        update: {
          verifyStatus: approve ? VerifyStatus.APPROVED : VerifyStatus.REJECTED,
          rejectReason: approve ? null : rejectReason,
          plateNo: row.plateNo,
          carModel: row.carModel,
          carColor: row.carColor,
        },
        create: {
          userId: row.userId,
          verifyStatus: approve ? VerifyStatus.APPROVED : VerifyStatus.REJECTED,
          plateNo: row.plateNo,
          carModel: row.carModel,
          carColor: row.carColor,
        },
      });

      if (approve) {
        const role = await tx.role.findUnique({ where: { code: RoleCode.DRIVER } });
        if (role) {
          await tx.userRole.upsert({
            where: { userId_roleId: { userId: row.userId, roleId: role.id } },
            update: {},
            create: { userId: row.userId, roleId: role.id },
          });
        }
      }
      return updated;
    });
  }
}
