import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ActiveMode, MatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/constants/error-codes';
import { CURRENT_LEGAL_VERSION } from '../common/constants/legal';
import { decryptPhone, encryptPhone, maskPhone } from '../common/utils/phone-crypto';
import { decryptWechatData } from '../common/utils/wechat-crypto';
import { WechatService } from '../auth/wechat.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wechat: WechatService,
  ) {}

  /** Require accepted legal for high-stakes writes (publish / confirm). */
  async assertLegalAccepted(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { legalAcceptedAt: true, legalVersion: true },
    });
    if (!user?.legalAcceptedAt || user.legalVersion !== CURRENT_LEGAL_VERSION) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: '请先阅读并同意最新用户协议与平台说明',
      });
    }
  }

  /** Require bound phone for publish / confirm (U4). */
  async assertPhoneBound(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phoneEnc: true, phoneMask: true },
    });
    if (!user?.phoneEnc) {
      throw new ForbiddenException({
        code: ErrorCode.PHONE_REQUIRED,
        message: '请先绑定手机号后再操作',
      });
    }
  }

  async acceptLegal(userId: string, version?: string) {
    const v = (version || CURRENT_LEGAL_VERSION).trim();
    if (v !== CURRENT_LEGAL_VERSION) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `协议版本无效，当前版本为 ${CURRENT_LEGAL_VERSION}`,
      });
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        legalAcceptedAt: new Date(),
        legalVersion: CURRENT_LEGAL_VERSION,
      },
      select: {
        id: true,
        legalAcceptedAt: true,
        legalVersion: true,
      },
    });
  }

  async listUsers(page = 1, pageSize = 20) {
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const [total, items] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          openid: true,
          username: true,
          nickname: true,
          avatar: true,
          phoneMask: true,
          activeMode: true,
          status: true,
          createdAt: true,
          roles: {
            select: {
              role: { select: { code: true, name: true } },
            },
          },
          driverProfile: true,
        },
      }),
    ]);

    return {
      total,
      page,
      pageSize: take,
      items: items.map((u) => ({
        ...u,
        roles: u.roles.map((r) => r.role),
      })),
    };
  }

  async setMode(userId: string, mode: ActiveMode) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { activeMode: mode },
      select: { id: true, activeMode: true },
    });
  }

  async setStatus(adminId: string, userId: string, status: number) {
    void adminId;
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, status: true },
    });
  }

  /**
   * Bind phone:
   * 1) preferred: `code` from button open-type=getPhoneNumber (getuserphonenumber API)
   * 2) legacy: encryptedData + iv + session_key from login
   * 3) mock: phoneNumber or encryptedData mock:
   */
  async bindPhone(
    userId: string,
    body: { code?: string; encryptedData?: string; iv?: string; phoneNumber?: string },
  ) {
    let phone: string | null = null;

    if (this.wechat.isMock()) {
      if (body.phoneNumber) phone = body.phoneNumber;
      else if (body.code?.startsWith('mock:')) phone = body.code.slice(5);
      else if (body.encryptedData?.startsWith('mock:')) phone = body.encryptedData.slice(5);
      else if (body.code) phone = await this.wechat.getPhoneNumberByCode(body.code);
      else phone = '13800138000';
    } else if (body.code) {
      phone = await this.wechat.getPhoneNumberByCode(body.code);
      if (!phone) {
        throw new BadRequestException({
          code: ErrorCode.BAD_REQUEST,
          message: 'Failed to get phone from WeChat (check code / access_token)',
        });
      }
    } else if (body.encryptedData && body.iv) {
      const sessionKey = await this.wechat.getSessionKey(userId);
      if (!sessionKey) {
        throw new BadRequestException({
          code: ErrorCode.BAD_REQUEST,
          message: 'Session expired; please login again then re-authorize phone',
        });
      }
      try {
        const data = decryptWechatData(sessionKey, body.encryptedData, body.iv);
        phone =
          (data.purePhoneNumber as string) ||
          (data.phoneNumber as string) ||
          null;
      } catch {
        throw new BadRequestException({
          code: ErrorCode.BAD_REQUEST,
          message: 'Failed to decrypt phone payload',
        });
      }
    } else {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Provide code (preferred) or encryptedData+iv',
      });
    }

    // strip +86
    if (phone?.startsWith('+86')) phone = phone.slice(3);
    if (phone?.startsWith('86') && phone.length === 13) phone = phone.slice(2);

    if (!phone || !/^1\d{10}$/.test(phone)) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Invalid phone number',
      });
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        phoneEnc: encryptPhone(phone),
        phoneMask: maskPhone(phone),
      },
      select: { id: true, phoneMask: true },
    });
  }

  async contactPhone(viewerId: string, matchOrderId: string) {
    const order = await this.prisma.matchOrder.findUnique({
      where: { id: matchOrderId },
    });
    if (!order) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Match not found' });
    }
    if (order.passengerId !== viewerId) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Only passenger can access driver phone',
      });
    }
    if (order.status !== MatchStatus.CONFIRMED && order.status !== MatchStatus.COMPLETED) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Match not confirmed',
      });
    }

    const driver = await this.prisma.user.findUnique({ where: { id: order.driverId } });
    if (!driver?.phoneEnc) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Driver has not bound phone',
      });
    }

    await this.prisma.phoneAccessLog.create({
      data: {
        viewerId,
        targetUserId: order.driverId,
        matchOrderId,
      },
    });

    const phone = decryptPhone(driver.phoneEnc);
    return {
      phone,
      phoneMask: driver.phoneMask,
      matchOrderId,
      targetUserId: order.driverId,
    };
  }
}
