import express from 'express';
import cors from 'cors';
import { corsOrigins } from './config';
import { errorHandler, notFound } from './lib/http';
import { AuthService } from './modules/auth/auth.service';
import { authRoutes } from './modules/auth/auth.routes';
import { DutyService } from './modules/duty/duty.service';
import { dutyRoutes } from './modules/duty/duty.routes';
import { TripService } from './modules/trip/trip.service';
import { tripRoutes } from './modules/trip/trip.routes';
import { LocationService } from './modules/location/location.service';
import { locationRoutes } from './modules/location/location.routes';
import { SosService } from './modules/sos/sos.service';
import { sosRoutes } from './modules/sos/sos.routes';
import { DriverService } from './modules/drivers/driver.service';
import { driverRoutes } from './modules/drivers/driver.routes';
import { TripsService } from './modules/trips/trips.service';
import { tripsRoutes } from './modules/trips/trips.routes';
import type { PrismaClient } from '@prisma/client';
import type { RealtimeBus } from './realtime';

export type AppDeps = {
  prisma: PrismaClient;
  realtime: RealtimeBus;
};

export function createApp({ prisma, realtime }: AppDeps) {
  const app = express();

  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json());

  const authService = new AuthService(prisma);
  const dutyService = new DutyService(prisma, realtime);
  const tripService = new TripService(prisma, realtime);
  const locationService = new LocationService(prisma, realtime);
  const sosService = new SosService(prisma, realtime);
  const driverService = new DriverService(prisma);
  const tripsService = new TripsService(prisma);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRoutes(authService));
  app.use('/api/duty', dutyRoutes(dutyService));
  app.use('/api/trip', tripRoutes(tripService));
  app.use('/api/location', locationRoutes(locationService));
  app.use('/api/sos', sosRoutes(sosService));
  app.use('/api/drivers', driverRoutes(driverService));
  app.use('/api/trips', tripsRoutes(tripsService));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
