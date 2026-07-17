import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../config/redis.module';

type Code2SessionResult = {
  openid: string;
  sessionKey: string;
  unionid?: string;
};

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);
  /** fallback when Redis unavailable */
  private readonly memSession = new Map<string, { key: string; exp: number }>();
  private accessTokenCache: { token: string; exp: number } | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  isMock(): boolean {
    return this.config.get<string>('WECHAT_MOCK') === '1';
  }

  async code2Session(code: string): Promise<Code2SessionResult | null> {
    if (this.isMock()) {
      return {
        openid: `mock_${code}`,
        sessionKey: Buffer.from(`mock-session-${code}`).toString('base64'),
      };
    }

    const appId = this.config.get<string>('WECHAT_APPID');
    const secret = this.config.get<string>('WECHAT_SECRET');
    if (!appId || !secret || appId.startsWith('your-')) {
      return null;
    }

    const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
    url.searchParams.set('appid', appId);
    url.searchParams.set('secret', secret);
    url.searchParams.set('js_code', code);
    url.searchParams.set('grant_type', 'authorization_code');

    try {
      const res = await fetch(url.toString());
      const data = (await res.json()) as {
        openid?: string;
        session_key?: string;
        unionid?: string;
        errcode?: number;
        errmsg?: string;
      };
      if (data.errcode || !data.openid || !data.session_key) {
        this.logger.warn(`code2session failed: ${data.errmsg || data.errcode}`);
        return null;
      }
      return {
        openid: data.openid,
        sessionKey: data.session_key,
        unionid: data.unionid,
      };
    } catch (e) {
      this.logger.error(`code2session network error: ${String(e)}`);
      return null;
    }
  }

  async saveSessionKey(userId: string, sessionKey: string, ttlSec = 7200) {
    const redisKey = `wx:sk:${userId}`;
    const client = this.redis.raw;
    if (client) {
      try {
        await client.set(redisKey, sessionKey, 'EX', ttlSec);
        return;
      } catch {
        /* fall through */
      }
    }
    this.memSession.set(userId, { key: sessionKey, exp: Date.now() + ttlSec * 1000 });
  }

  async getSessionKey(userId: string): Promise<string | null> {
    const redisKey = `wx:sk:${userId}`;
    const client = this.redis.raw;
    if (client) {
      try {
        const v = await client.get(redisKey);
        if (v) return v;
      } catch {
        /* fall through */
      }
    }
    const m = this.memSession.get(userId);
    if (!m) return null;
    if (m.exp < Date.now()) {
      this.memSession.delete(userId);
      return null;
    }
    return m.key;
  }

  /** client_credential access_token for getuserphonenumber */
  async getAccessToken(): Promise<string | null> {
    if (this.isMock()) return 'mock-access-token';
    if (this.accessTokenCache && this.accessTokenCache.exp > Date.now()) {
      return this.accessTokenCache.token;
    }
    const appId = this.config.get<string>('WECHAT_APPID');
    const secret = this.config.get<string>('WECHAT_SECRET');
    if (!appId || !secret || appId.startsWith('your-')) return null;

    const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
    url.searchParams.set('grant_type', 'client_credential');
    url.searchParams.set('appid', appId);
    url.searchParams.set('secret', secret);
    try {
      const res = await fetch(url.toString());
      const data = (await res.json()) as {
        access_token?: string;
        expires_in?: number;
        errcode?: number;
        errmsg?: string;
      };
      if (!data.access_token) {
        this.logger.warn(`access_token failed: ${data.errmsg || data.errcode}`);
        return null;
      }
      this.accessTokenCache = {
        token: data.access_token,
        exp: Date.now() + ((data.expires_in || 7200) - 120) * 1000,
      };
      return data.access_token;
    } catch (e) {
      this.logger.error(`access_token error: ${String(e)}`);
      return null;
    }
  }

  /**
   * New getPhoneNumber API: frontend passes phone code from button.
   * https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-info/phone-number/getPhoneNumber.html
   */
  async getPhoneNumberByCode(phoneCode: string): Promise<string | null> {
    if (this.isMock()) {
      if (phoneCode.startsWith('mock:')) return phoneCode.slice(5);
      return '13800138000';
    }
    const token = await this.getAccessToken();
    if (!token) return null;
    try {
      const res = await fetch(
        `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: phoneCode }),
        },
      );
      const data = (await res.json()) as {
        errcode?: number;
        errmsg?: string;
        phone_info?: { purePhoneNumber?: string; phoneNumber?: string };
      };
      if (data.errcode && data.errcode !== 0) {
        this.logger.warn(`getuserphonenumber failed: ${data.errmsg}`);
        return null;
      }
      return data.phone_info?.purePhoneNumber || data.phone_info?.phoneNumber || null;
    } catch (e) {
      this.logger.error(`getuserphonenumber error: ${String(e)}`);
      return null;
    }
  }
}
