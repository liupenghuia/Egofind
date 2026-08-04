import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { VerifyStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/constants/error-codes';
import { RoleCode } from '../common/constants/roles';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DriverVerificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async me(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
    const latest = await this.prisma.driverVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const status =
      profile?.verifyStatus ||
      latest?.status ||
      ('NONE' as const);
    return {
      status,
      rejectReason: profile?.rejectReason || latest?.rejectReason || null,
      profile: profile
        ? {
            plateNo: profile.plateNo,
            carModel: profile.carModel,
            carColor: profile.carColor,
            verifyStatus: profile.verifyStatus,
            rejectReason: profile.rejectReason,
          }
        : null,
      latest: latest
        ? {
            id: latest.id,
            status: latest.status,
            realName: latest.realName,
            idCardMask: latest.idCardMask,
            plateNo: latest.plateNo,
            carModel: latest.carModel,
            carColor: latest.carColor,
            licenseImg: latest.licenseImg,
            vehicleImg: latest.vehicleImg,
            rejectReason: latest.rejectReason,
            createdAt: latest.createdAt,
            reviewedAt: latest.reviewedAt,
          }
        : null,
      canSubmit:
        status === 'NONE' ||
        status === VerifyStatus.REJECTED ||
        (!profile && !latest),
      canPublish: status === VerifyStatus.APPROVED,
    };
  }

  async submit(
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
    const plateNo = data.plateNo?.trim();
    const realName = data.realName?.trim();
    if (!plateNo) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: '请填写车牌号',
      });
    }
    if (!realName) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: '请填写真实姓名',
      });
    }

    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
    if (profile?.verifyStatus === VerifyStatus.PENDING) {
      throw new ConflictException({
        code: ErrorCode.CONFLICT,
        message: '认证审核中，请勿重复提交',
      });
    }
    if (profile?.verifyStatus === VerifyStatus.APPROVED) {
      throw new ConflictException({
        code: ErrorCode.CONFLICT,
        message: '已通过认证，无需重复提交',
      });
    }

    const pending = await this.prisma.driverVerification.findFirst({
      where: { userId, status: VerifyStatus.PENDING },
    });
    if (pending) {
      throw new ConflictException({
        code: ErrorCode.CONFLICT,
        message: '认证审核中，请勿重复提交',
      });
    }

    const payload = {
      realName,
      idCardMask: data.idCardMask?.trim() || undefined,
      licenseImg: data.licenseImg?.trim() || undefined,
      vehicleImg: data.vehicleImg?.trim() || undefined,
      plateNo,
      carModel: data.carModel?.trim() || undefined,
      carColor: data.carColor?.trim() || undefined,
    };

    return this.prisma.$transaction(async (tx) => {
      await tx.driverProfile.upsert({
        where: { userId },
        update: {
          plateNo: payload.plateNo,
          carModel: payload.carModel,
          carColor: payload.carColor,
          verifyStatus: VerifyStatus.PENDING,
          rejectReason: null,
        },
        create: {
          userId,
          plateNo: payload.plateNo,
          carModel: payload.carModel,
          carColor: payload.carColor,
          verifyStatus: VerifyStatus.PENDING,
        },
      });
      return tx.driverVerification.create({
        data: {
          userId,
          ...payload,
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
        message: '无效的认证申请',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.driverVerification.update({
        where: { id },
        data: {
          status: approve ? VerifyStatus.APPROVED : VerifyStatus.REJECTED,
          rejectReason: approve ? null : rejectReason || '资料不全',
          reviewedAt: new Date(),
          reviewerId: adminId,
        },
      });

      await tx.driverProfile.upsert({
        where: { userId: row.userId },
        update: {
          verifyStatus: approve ? VerifyStatus.APPROVED : VerifyStatus.REJECTED,
          rejectReason: approve ? null : rejectReason || '资料不全',
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
          rejectReason: approve ? null : rejectReason || '资料不全',
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
    }).then(async (updated) => {
      if (approve) {
        await this.notifications.push(
          row.userId,
          'DRIVER_VERIFY_APPROVED',
          '司机认证已通过',
          '您可以发布车找人行程了。',
          { verificationId: id },
        );
      } else {
        await this.notifications.push(
          row.userId,
          'DRIVER_VERIFY_REJECTED',
          '司机认证未通过',
          rejectReason || '资料不全，请修改后重新提交。',
          { verificationId: id },
        );
      }
      return updated;
    });
  }
}
