import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server, type Socket } from 'socket.io';
import { UserRole } from '@prisma/client';
import { env, corsOrigins } from './config';

type TokenPayload = {
  sub: string;
  role: UserRole;
};

export type RealtimeEvents = {
  'driver:location': {
    driverId: string;
    lat: number;
    lng: number;
    speed: number | null;
    heading: number | null;
    batteryLevel: number | null;
    status: string;
    lastSeenAt: Date;
  };
  'driver:status': {
    driverId: string;
    status: string;
    lastSeenAt: Date;
  };
  'sos:new': {
    id: string;
    driverId: string;
    lat: number | null;
    lng: number | null;
    createdAt: Date;
    status: string;
  };
  'sos:update': {
    id: string;
    driverId: string;
    lat: number | null;
    lng: number | null;
    createdAt: Date;
    resolvedAt: Date | null;
    status: string;
  };
};

export function createSocketServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string' || !token) {
      next(new Error('Unauthorized'));
      return;
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      socket.data.auth = { userId: payload.sub, role: payload.role };
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const auth = socket.data.auth as { userId: string; role: UserRole };
    if (auth.role === UserRole.ADMIN || auth.role === UserRole.DISPATCHER) {
      socket.join('admins');
    }
    if (auth.role === UserRole.DRIVER) {
      socket.join(`driver:${auth.userId}`);
    }
  });

  return io;
}
