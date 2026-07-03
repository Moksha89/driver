import { Router } from 'express';
import { z } from 'zod';
import type { TripService } from './trip.service';
import { asyncHandler } from '../../lib/http';
import { requireAuth, requireRoles } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

const startSchema = z.object({
  vehicleId: z.string().min(1).optional(),
});

export function tripRoutes(tripService: TripService) {
  const router = Router();

  router.post(
    '/start',
    requireAuth,
    requireRoles(UserRole.DRIVER),
    asyncHandler(async (req, res) => {
      const body = startSchema.parse(req.body ?? {});
      res.json(await tripService.start(req.auth!.userId, body.vehicleId));
    }),
  );

  router.post(
    '/end',
    requireAuth,
    requireRoles(UserRole.DRIVER),
    asyncHandler(async (req, res) => {
      res.json(await tripService.end(req.auth!.userId));
    }),
  );

  return router;
}
