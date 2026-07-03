import { Router } from 'express';
import { z } from 'zod';
import type { TripsService } from './trips.service';
import { asyncHandler } from '../../lib/http';
import { requireAuth, requireRoles } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

export function tripsRoutes(tripsService: TripsService) {
  const router = Router();
  const idSchema = z.string().min(1);

  router.get(
    '/:id/route',
    requireAuth,
    requireRoles(UserRole.ADMIN, UserRole.DISPATCHER),
    asyncHandler(async (req, res) => {
      const id = idSchema.parse(req.params.id);
      res.json(await tripsService.route(id));
    }),
  );

  return router;
}
