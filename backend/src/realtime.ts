import type { Server as SocketServer } from 'socket.io';

export type DriverLocationEvent = {
  driverId: string;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  batteryLevel: number | null;
  status: string;
  lastSeenAt: Date;
};

export type DriverStatusEvent = {
  driverId: string;
  status: string;
  lastSeenAt: Date;
};

export type SosEvent = {
  id: string;
  driverId: string;
  lat: number | null;
  lng: number | null;
  createdAt: Date;
  resolvedAt?: Date | null;
  status: string;
};

export type RealtimeBus = {
  emitDriverLocation(event: DriverLocationEvent): void;
  emitDriverStatus(event: DriverStatusEvent): void;
  emitSosNew(event: SosEvent): void;
  emitSosUpdate(event: SosEvent): void;
};

export function createSocketRealtimeBus(io: SocketServer): RealtimeBus {
  return {
    emitDriverLocation(event) {
      io.to('admins').emit('driver:location', event);
    },
    emitDriverStatus(event) {
      io.to('admins').emit('driver:status', event);
    },
    emitSosNew(event) {
      io.to('admins').emit('sos:new', event);
    },
    emitSosUpdate(event) {
      io.to('admins').emit('sos:update', event);
    },
  };
}
