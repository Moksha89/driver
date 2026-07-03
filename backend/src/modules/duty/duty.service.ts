import type { DriverStatus, PrismaClient } from '@prisma/client';
import { HttpError } from '../../lib/http';
import type { RealtimeBus } from '../../realtime';

export class DutyService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly realtime: RealtimeBus,
  ) {}

  async start(driverId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.driverProfile.upsert({
        where: { userId: driverId },
        create: { userId: driverId, status: 'ON_DUTY' },
        update: { status: 'ON_DUTY' },
      });

      const activeDuty = await tx.duty.findFirst({
        where: { driverId, endedAt: null },
      });
      if (activeDuty) {
        throw new HttpError(409, 'Duty already active');
      }

      const duty = await tx.duty.create({
        data: { driverId },
      });

      return { duty, profile };
    });

    this.realtime.emitDriverStatus({
      driverId,
      status: result.profile.status,
      lastSeenAt: new Date(),
    });

    return result;
  }

  async end(driverId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const activeDuty = await tx.duty.findFirst({
        where: { driverId, endedAt: null },
        orderBy: { startedAt: 'desc' },
      });
      if (!activeDuty) {
        throw new HttpError(409, 'No active duty');
      }

      const activeTrip = await tx.trip.findFirst({
        where: { driverId, endedAt: null, status: 'ACTIVE' },
        orderBy: { startedAt: 'desc' },
      });

      if (activeTrip) {
        await tx.trip.update({
          where: { id: activeTrip.id },
          data: { endedAt: new Date(), status: 'CANCELLED' },
        });
      }

      const duty = await tx.duty.update({
        where: { id: activeDuty.id },
        data: { endedAt: new Date() },
      });

      const profile = await tx.driverProfile.upsert({
        where: { userId: driverId },
        create: { userId: driverId, status: 'OFFLINE' },
        update: { status: 'OFFLINE' },
      });

      return { duty, profile };
    });

    this.realtime.emitDriverStatus({
      driverId,
      status: result.profile.status,
      lastSeenAt: new Date(),
    });

    return result;
  }
}

export type DutyStatus = DriverStatus;
