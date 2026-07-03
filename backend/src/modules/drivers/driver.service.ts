import type { PrismaClient } from '@prisma/client';
import { HttpError } from '../../lib/http';

export class DriverService {
  constructor(private readonly prisma: PrismaClient) {}

  async list() {
    const users = await this.prisma.user.findMany({
      where: { role: 'DRIVER' },
      orderBy: { createdAt: 'asc' },
      include: {
        driverProfile: { include: { currentVehicle: true } },
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      profile: {
        status: user.driverProfile?.status ?? 'OFFLINE',
        batteryLevel: user.driverProfile?.batteryLevel ?? null,
        networkStatus: user.driverProfile?.networkStatus ?? null,
        lastLat: user.driverProfile?.lastLat ?? null,
        lastLng: user.driverProfile?.lastLng ?? null,
        lastSpeed: user.driverProfile?.lastSpeed ?? null,
        lastHeading: user.driverProfile?.lastHeading ?? null,
        lastSeenAt: user.driverProfile?.lastSeenAt ?? null,
        currentVehicle: user.driverProfile?.currentVehicle
          ? {
              id: user.driverProfile.currentVehicle.id,
              plate: user.driverProfile.currentVehicle.plate,
              label: user.driverProfile.currentVehicle.label,
            }
          : null,
      },
    }));
  }

  async detail(actorId: string, driverId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: driverId },
      include: {
        driverProfile: { include: { currentVehicle: true } },
        duties: { orderBy: { startedAt: 'desc' }, take: 50 },
        trips: { orderBy: { startedAt: 'desc' }, take: 20 },
      },
    });

    if (!user || user.role !== 'DRIVER') {
      throw new HttpError(404, 'Driver not found');
    }

    await this.prisma.accessLog.create({
      data: {
        actorId,
        action: 'VIEW_DRIVER',
        targetDriverId: driverId,
      },
    });

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      profile: {
        status: user.driverProfile?.status ?? 'OFFLINE',
        batteryLevel: user.driverProfile?.batteryLevel ?? null,
        networkStatus: user.driverProfile?.networkStatus ?? null,
        lastLat: user.driverProfile?.lastLat ?? null,
        lastLng: user.driverProfile?.lastLng ?? null,
        lastSpeed: user.driverProfile?.lastSpeed ?? null,
        lastHeading: user.driverProfile?.lastHeading ?? null,
        lastSeenAt: user.driverProfile?.lastSeenAt ?? null,
        currentVehicle: user.driverProfile?.currentVehicle
          ? {
              id: user.driverProfile.currentVehicle.id,
              plate: user.driverProfile.currentVehicle.plate,
              label: user.driverProfile.currentVehicle.label,
            }
          : null,
      },
      duties: user.duties,
      activeTrip:
        user.trips.find((trip) => trip.status === 'ACTIVE' && trip.endedAt === null) ??
        null,
    };
  }

  async trips(driverId: string) {
    return this.prisma.trip.findMany({
      where: { driverId },
      orderBy: { startedAt: 'desc' },
    });
  }
}
