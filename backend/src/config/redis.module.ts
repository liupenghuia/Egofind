import { Global, Module, OnModuleDestroy, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis | null) {}

  get raw(): Redis | null {
    return this.client;
  }

  async ping(): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.ping();
    } catch {
      return null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis | null => {
        const url = config.get<string>('REDIS_URL');
        if (!url) {
          return null;
        }
        const client = new Redis(url, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          enableOfflineQueue: false,
        });
        client.connect().catch(() => {
          // Redis is optional at boot; health will report status
        });
        client.on('error', () => {
          // avoid unhandled error crash; health checks surface issues
        });
        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
