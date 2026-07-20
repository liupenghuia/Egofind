import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      // Delivery / local health can probe the HTTP process without MySQL.
      // Production and normal dev still fail fast on a missing database.
      if (process.env.EGOFIND_BOOT_WITHOUT_DB === '1') {
        // eslint-disable-next-line no-console
        console.warn(
          '[Prisma] $connect failed while EGOFIND_BOOT_WITHOUT_DB=1; continuing (health will report db=down)',
          err instanceof Error ? err.message : err,
        );
        return;
      }
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
