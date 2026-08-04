import { TripStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Lazy-expire open posts whose time window has ended. */
export async function expireStalePosts(prisma: PrismaService, now = new Date()) {
  await prisma.driverTrip.updateMany({
    where: {
      status: { in: [TripStatus.PUBLISHED, TripStatus.MATCHING] },
      departEnd: { lt: now },
    },
    data: { status: TripStatus.EXPIRED },
  });
  await prisma.passengerRequest.updateMany({
    where: {
      status: { in: [TripStatus.PUBLISHED, TripStatus.MATCHING] },
      expectEnd: { lt: now },
    },
    data: { status: TripStatus.EXPIRED },
  });
}
