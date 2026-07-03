import type { PrismaClient } from '@prisma/client';
import type { RealtimeBus } from '../../realtime';

export class SosService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly realtime: RealtimeBus,
  ) {}

  async create(driverId: string, lat?: number, lng?: number) {
    const alert = await this.prisma.sosAlert.create({
      data: { driverId, lat: lat ?? null, lng: lng ?? null, status: 'OPEN' },
    });

    this.realtime.emitSosNew(alert);
    return alert;
  }

  async list(status?: string) {
    if (status) {
      return this.prisma.sosAlert.findMany({
        where: {
          status: status as 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED',
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.sosAlert.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async ack(id: string) {
    const alert = await this.prisma.sosAlert.update({
      where: { id },
      data: { status: 'ACKNOWLEDGED' },
    });
    this.realtime.emitSosUpdate(alert);
    return alert;
  }

  async resolve(id: string) {
    const alert = await this.prisma.sosAlert.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
    this.realtime.emitSosUpdate(alert);
    return alert;
  }
}
