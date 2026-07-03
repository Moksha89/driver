import { Router } from 'express';
import { z } from 'zod';
import type { SosService } from './sos.service';
import { asyncHandler } from '../../lib/http';
import { requireAuth, requireRoles } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

const createSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export function sosRoutes(sosService: SosService) {
  const router = Router();
  const idSchema = z.string().min(1);

  router.post(
    '/',
    requireAuth,
    requireRoles(UserRole.DRIVER),
    asyncHandler(async (req, res) => {
      const body = createSchema.parse(req.body ?? {});
      res.status(201).json(await sosService.create(req.auth!.userId, body.lat, body.lng));
    }),
  );

  router.get(
    '/',
    requireAuth,
    requireRoles(UserRole.ADMIN, UserRole.DISPATCHER),
    asyncHandler(async (req, res) => {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      res.json(await sosService.list(status));
    }),
  );

  router.post(
    '/:id/ack',
    requireAuth,
    requireRoles(UserRole.ADMIN, UserRole.DISPATCHER),
    asyncHandler(async (req, res) => {
      const id = idSchema.parse(req.params.id);
      res.json(await sosService.ack(id));
    }),
  );

  router.post(
    '/:id/resolve',
    requireAuth,
    requireRoles(UserRole.ADMIN, UserRole.DISPATCHER),
    asyncHandler(async (req, res) => {
      const id = idSchema.parse(req.params.id);
      res.json(await sosService.resolve(id));
    }),
  );

  return router;
}
