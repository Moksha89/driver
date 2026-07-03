import type { PrismaClient } from '@prisma/client';
import { HttpError } from '../../lib/http';
import type { RealtimeBus } from '../../realtime';

export class TripService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly realtime: RealtimeBus,
  ) {}

  async start(driverId: string, vehicleId?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.driverProfile.findUnique({
        where: { userId: driverId },
      });

      if (!profile || profile.status !== 'ON_DUTY') {
        throw new HttpError(409, 'Driver must be on duty');
      }

      const activeTrip = await tx.trip.findFirst({
        where: { driverId, endedAt: null, status: 'ACTIVE' },
      });
      if (activeTrip) {
        throw new HttpError(409, 'Trip already active');
      }

      const duty = await tx.duty.findFirst({
        where: { driverId, endedAt: null },
        orderBy: { startedAt: 'desc' },
      });
      if (!duty) {
        throw new HttpError(409, 'No active duty');
      }

      const trip = await tx.trip.create({
        data: {
          driverId,
          dutyId: duty.id,
          vehicleId: vehicleId ?? profile.currentVehicleId ?? null,
          status: 'ACTIVE',
        },
      });
      const updatedProfile = await tx.driverProfile.upsert({
        where: { userId: driverId },
        create: {
          userId: driverId,
          status: 'ON_TRIP',
          ...(vehicleId ? { currentVehicleId: vehicleId } : {}),
        },
        update: {
          status: 'ON_TRIP',
          ...(vehicleId ? { currentVehicleId: vehicleId } : {}),
        },
      });

      return { trip, profile: updatedProfile };
    });

    this.realtime.emitDriverStatus({
      driverId,
      status: result.profile.status,
      lastSeenAt: new Date(),
    });

    return result.trip;
  }

  async end(driverId: string) {
    const activeTrip = await this.prisma.trip.findFirst({
      where: { driverId, endedAt: null, status: 'ACTIVE' },
      orderBy: { startedAt: 'desc' },
    });
    if (!activeTrip) {
      throw new HttpError(409, 'No active trip');
    }

    const trip = await this.prisma.trip.update({
      where: { id: activeTrip.id },
      data: { endedAt: new Date(), status: 'COMPLETED' },
    });

    const profile = await this.prisma.driverProfile.upsert({
      where: { userId: driverId },
      create: { userId: driverId, status: 'ON_DUTY' },
      update: { status: 'ON_DUTY' },
    });

    this.realtime.emitDriverStatus({ driverId, status: profile.status, lastSeenAt: new Date() });

    return trip;
  }
}
