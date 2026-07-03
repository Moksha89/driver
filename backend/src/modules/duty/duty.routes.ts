import { Router } from 'express';
import type { DutyService } from './duty.service';
import { asyncHandler } from '../../lib/http';
import { requireAuth, requireRoles } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

export function dutyRoutes(dutyService: DutyService) {
  const router = Router();

  router.post(
    '/start',
    requireAuth,
    requireRoles(UserRole.DRIVER),
    asyncHandler(async (req, res) => {
      res.json(await dutyService.start(req.auth!.userId));
    }),
  );

  router.post(
    '/end',
    requireAuth,
    requireRoles(UserRole.DRIVER),
    asyncHandler(async (req, res) => {
      res.json(await dutyService.end(req.auth!.userId));
    }),
  );

  return router;
}
