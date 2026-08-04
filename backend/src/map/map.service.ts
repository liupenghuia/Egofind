import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TripStatus, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { sameRegion } from '../common/utils/geo';
import { TencentMapService } from './tencent-map.service';
import { ErrorCode } from '../common/constants/error-codes';
import { TripFeedbacksService } from '../trip-feedbacks/trip-feedbacks.service';
import { expireStalePosts } from '../common/utils/expire-stale';

@Injectable()
export class MapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly tencentMap: TencentMapService,
    private readonly tripFeedbacks: TripFeedbacksService,
  ) {}

  private scope(): 'county' | 'city' {
    return this.config.get<string>('MATCH_SCOPE') === 'city' ? 'city' : 'county';
  }

  /**
   * mode=passenger → show driver trips
   * mode=driver → show public passenger requests
   */
  async markers(params: {
    mode: 'passenger' | 'driver';
    userId?: string;
    adcode?: string;
    minLat?: number;
    maxLat?: number;
    minLng?: number;
    maxLng?: number;
  }) {
    // 司机模式=查找乘客：受月额度限制
    if (params.mode === 'driver' && params.userId) {
      await this.tripFeedbacks.assertDriverNotRestricted(params.userId, 'search');
    }

    await expireStalePosts(this.prisma);

    const now = new Date();
    const limit = 200;
    const filterAdcode = params.adcode
      ? this.tencentMap.normalizeAdcode(params.adcode)
      : undefined;

    if (params.mode === 'passenger') {
      const trips = await this.prisma.driverTrip.findMany({
        where: {
          status: { in: [TripStatus.PUBLISHED, TripStatus.MATCHING] },
          departEnd: { gt: now },
          ...(params.minLat != null
            ? {
                originLat: { gte: params.minLat, lte: params.maxLat },
                originLng: { gte: params.minLng, lte: params.maxLng },
              }
            : {}),
        },
        take: limit,
        orderBy: { departStart: 'asc' },
      });
      return trips
        .filter((t) =>
          filterAdcode
            ? sameRegion(filterAdcode, t.originAdcode, this.scope())
            : true,
        )
        .map((t) => ({
          id: t.id,
          type: 'driver_trip' as const,
          lat: t.originLat,
          lng: t.originLng,
          adcode: t.originAdcode,
          title: `${t.originName} → ${t.destName}`,
          seats: t.seatsLeft,
          departStart: t.departStart,
          priceCents: t.priceCents,
        }));
    }

    const reqs = await this.prisma.passengerRequest.findMany({
      where: {
        status: { in: [TripStatus.PUBLISHED, TripStatus.MATCHING] },
        visibility: Visibility.PUBLIC,
        expectEnd: { gt: now },
        ...(params.minLat != null
          ? {
              originLat: { gte: params.minLat, lte: params.maxLat },
              originLng: { gte: params.minLng, lte: params.maxLng },
            }
          : {}),
      },
      take: limit,
      orderBy: { expectStart: 'asc' },
    });
    return reqs
      .filter((r) =>
        filterAdcode
          ? sameRegion(filterAdcode, r.originAdcode, this.scope())
          : true,
      )
      .map((r) => ({
        id: r.id,
        type: 'passenger_request' as const,
        lat: r.originLat,
        lng: r.originLng,
        adcode: r.originAdcode,
        title: `${r.originName} → ${r.destName}`,
        seats: r.seatsNeeded,
        departStart: r.expectStart,
      }));
  }

  async reverseGeocode(lat?: number, lng?: number) {
    if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'lat and lng are required numbers',
      });
    }
    return this.tencentMap.reverseGeocode(lat, lng);
  }

  async geocode(address?: string) {
    if (!address?.trim()) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'address is required',
      });
    }
    try {
      return await this.tencentMap.geocode(address.trim());
    } catch (e) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: e instanceof Error ? e.message : 'geocode failed',
      });
    }
  }

  status() {
    return {
      tencentConfigured: this.tencentMap.isConfigured(),
      defaultAdcode: this.config.get('DEFAULT_ADCODE') || '130128',
      matchScope: this.scope(),
    };
  }
}
