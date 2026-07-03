import { Router } from 'express';
import { z } from 'zod';
import type { DriverService } from './driver.service';
import { asyncHandler } from '../../lib/http';
import { requireAuth, requireRoles } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

export function driverRoutes(driverService: DriverService) {
  const router = Router();
  const idSchema = z.string().min(1);

  router.get(
    '/',
    requireAuth,
    requireRoles(UserRole.ADMIN, UserRole.DISPATCHER),
    asyncHandler(async (_req, res) => {
      res.json(await driverService.list());
    }),
  );

  router.get(
    '/:id',
    requireAuth,
    requireRoles(UserRole.ADMIN, UserRole.DISPATCHER),
    asyncHandler(async (req, res) => {
      const driverId = idSchema.parse(req.params.id);
      res.json(await driverService.detail(req.auth!.userId, driverId));
    }),
  );

  router.get(
    '/:id/trips',
    requireAuth,
    requireRoles(UserRole.ADMIN, UserRole.DISPATCHER),
    asyncHandler(async (req, res) => {
      const driverId = idSchema.parse(req.params.id);
      res.json(await driverService.trips(driverId));
    }),
  );

  return router;
}
