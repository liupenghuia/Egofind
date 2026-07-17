import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TripStatus, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { sameRegion } from '../common/utils/geo';

@Injectable()
export class MapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
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
    adcode?: string;
    minLat?: number;
    maxLat?: number;
    minLng?: number;
    maxLng?: number;
  }) {
    const now = new Date();
    const limit = 200;

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
          params.adcode ? sameRegion(params.adcode, t.originAdcode, this.scope()) : true,
        )
        .map((t) => ({
          id: t.id,
          type: 'driver_trip' as const,
          lat: t.originLat,
          lng: t.originLng,
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
        params.adcode ? sameRegion(params.adcode, r.originAdcode, this.scope()) : true,
      )
      .map((r) => ({
        id: r.id,
        type: 'passenger_request' as const,
        lat: r.originLat,
        lng: r.originLng,
        title: `${r.originName} → ${r.destName}`,
        seats: r.seatsNeeded,
        departStart: r.expectStart,
      }));
  }
}
