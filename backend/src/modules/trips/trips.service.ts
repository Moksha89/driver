import type { PrismaClient } from '@prisma/client';

export class TripsService {
  constructor(private readonly prisma: PrismaClient) {}

  async route(tripId: string) {
    return this.prisma.locationPing.findMany({
      where: { tripId },
      orderBy: { recordedAt: 'asc' },
    });
  }
}
