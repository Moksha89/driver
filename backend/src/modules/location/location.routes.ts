import { Router } from 'express';
import { z } from 'zod';
import type { LocationService } from './location.service';
import { asyncHandler } from '../../lib/http';
import { requireAuth, requireRoles } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

const schema = z.object({
  lat: z.number(),
  lng: z.number(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  batteryLevel: z.number().int().min(0).max(100).optional(),
  networkStatus: z.string().min(1).optional(),
});

export function locationRoutes(locationService: LocationService) {
  const router = Router();

  router.post(
    '/',
    requireAuth,
    requireRoles(UserRole.DRIVER),
    asyncHandler(async (req, res) => {
      const body = schema.parse(req.body);
      res.json(
        await locationService.ingest(req.auth!.userId, {
          lat: body.lat,
          lng: body.lng,
          speed: body.speed,
          heading: body.heading,
          batteryLevel: body.batteryLevel,
          networkStatus: body.networkStatus,
        }),
      );
    }),
  );

  return router;
}
