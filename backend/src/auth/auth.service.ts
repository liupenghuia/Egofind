import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RoleCode } from '../common/constants/roles';
import { ErrorCode } from '../common/constants/error-codes';
import { CURRENT_LEGAL_VERSION } from '../common/constants/legal';
import { AdminLoginDto } from './dto/admin-login.dto';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { WechatService } from './wechat.service';

type AuthUserView = {
  id: string;
  openid: string | null;
  username: string | null;
  nickname: string | null;
  avatar: string | null;
  phoneMask: string | null;
  roles: string[];
  permissions: string[];
  legalAcceptedAt: string | null;
  legalVersion: string | null;
  legalCurrentVersion: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly wechat: WechatService,
  ) {}

  async loginWechat(dto: WechatLoginDto) {
    const session = await this.wechat.code2Session(dto.code);
    if (!session?.openid) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message:
          'Failed to resolve WeChat openid. Check WECHAT_APPID/SECRET or set WECHAT_MOCK=1',
      });
    }

    let user = await this.prisma.user.findUnique({ where: { openid: session.openid } });
    if (!user) {
      const role = await this.prisma.role.findUnique({ where: { code: RoleCode.USER } });
      user = await this.prisma.user.create({
        data: {
          openid: session.openid,
          unionid: session.unionid,
          nickname: `微信用户${session.openid.slice(-4)}`,
          roles: role
            ? {
                create: { roleId: role.id },
              }
            : undefined,
        },
      });
    } else if (session.unionid && !user.unionid) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { unionid: session.unionid },
      });
    }

    await this.wechat.saveSessionKey(user.id, session.sessionKey);
    this.logger.debug(`WeChat session stored for user ${user.id}`);
    return this.buildAuthResult(user.id);
  }

  async loginAdmin(dto: AdminLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Invalid username or password',
      });
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Invalid username or password',
      });
    }

    if (user.status !== 1) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'User inactive',
      });
    }

    return this.buildAuthResult(user.id);
  }

  async getMe(userId: string): Promise<AuthUserView> {
    const user = await this.loadUserWithRoles(userId);
    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'User not found',
      });
    }
    return this.toView(user);
  }

  private async buildAuthResult(userId: string) {
    const user = await this.loadUserWithRoles(userId);
    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'User not found',
      });
    }
    const view = this.toView(user);
    const accessToken = await this.jwt.signAsync({
      sub: view.id,
      roles: view.roles,
    });
    return { accessToken, tokenType: 'Bearer', user: view };
  }

  private async loadUserWithRoles(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
  }

  private toView(
    user: NonNullable<Awaited<ReturnType<AuthService['loadUserWithRoles']>>>,
  ): AuthUserView {
    const roles = user.roles.map((ur) => ur.role.code);
    const permissions = [
      ...new Set(
        user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.code)),
      ),
    ];
    return {
      id: user.id,
      openid: user.openid,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      phoneMask: user.phoneMask,
      roles,
      permissions,
      legalAcceptedAt: user.legalAcceptedAt
        ? user.legalAcceptedAt.toISOString()
        : null,
      legalVersion: user.legalVersion,
      legalCurrentVersion: CURRENT_LEGAL_VERSION,
    };
  }
}
