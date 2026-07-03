import type { PrismaClient } from '@prisma/client';
import type { RealtimeBus } from '../../realtime';

export class LocationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly realtime: RealtimeBus,
  ) {}

  async ingest(driverId: string, payload: {
    lat: number;
    lng: number;
    speed?: number | undefined;
    heading?: number | undefined;
    batteryLevel?: number | undefined;
    networkStatus?: string | undefined;
  }) {
    const activeTrip = await this.prisma.trip.findFirst({
      where: { driverId, endedAt: null, status: 'ACTIVE' },
      orderBy: { startedAt: 'desc' },
    });

    const ping = await this.prisma.locationPing.create({
      data: {
        driverId,
        tripId: activeTrip?.id ?? null,
        lat: payload.lat,
        lng: payload.lng,
        ...(payload.speed !== undefined ? { speed: payload.speed } : {}),
        ...(payload.heading !== undefined ? { heading: payload.heading } : {}),
        ...(payload.batteryLevel !== undefined ? { batteryLevel: payload.batteryLevel } : {}),
        ...(payload.networkStatus !== undefined ? { networkStatus: payload.networkStatus } : {}),
      },
    });

    const profileCreate = {
      userId: driverId,
      status: activeTrip ? ('ON_TRIP' as const) : ('ON_DUTY' as const),
      lastLat: payload.lat,
      lastLng: payload.lng,
      lastSeenAt: ping.recordedAt,
      ...(payload.batteryLevel !== undefined ? { batteryLevel: payload.batteryLevel } : {}),
      ...(payload.networkStatus !== undefined ? { networkStatus: payload.networkStatus } : {}),
      ...(payload.speed !== undefined ? { lastSpeed: payload.speed } : {}),
      ...(payload.heading !== undefined ? { lastHeading: payload.heading } : {}),
    };

    const profileUpdate = {
      status: activeTrip ? ('ON_TRIP' as const) : ('ON_DUTY' as const),
      lastLat: payload.lat,
      lastLng: payload.lng,
      lastSeenAt: ping.recordedAt,
      ...(payload.batteryLevel !== undefined ? { batteryLevel: payload.batteryLevel } : {}),
      ...(payload.networkStatus !== undefined ? { networkStatus: payload.networkStatus } : {}),
      ...(payload.speed !== undefined ? { lastSpeed: payload.speed } : {}),
      ...(payload.heading !== undefined ? { lastHeading: payload.heading } : {}),
    };

    const profile = await this.prisma.driverProfile.upsert({
      where: { userId: driverId },
      create: profileCreate,
      update: profileUpdate,
    });

    this.realtime.emitDriverLocation({
      driverId,
      lat: ping.lat,
      lng: ping.lng,
      speed: ping.speed ?? null,
      heading: ping.heading ?? null,
      batteryLevel: ping.batteryLevel ?? null,
      status: profile.status,
      lastSeenAt: ping.recordedAt,
    });

    return { ping, profile };
  }
}
