import { Router } from 'express';
import { z } from 'zod';
import type { AuthService } from './auth.service';
import { asyncHandler } from '../../lib/http';
import { requireAuth } from '../../middleware/auth';

const loginSchema = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
});

export function authRoutes(authService: AuthService) {
  const router = Router();

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      const body = loginSchema.parse(req.body);
      res.json(await authService.login(body.phone, body.password));
    }),
  );

  router.get(
    '/me',
    requireAuth,
    asyncHandler(async (req, res) => {
      res.json(await authService.me(req.auth!.userId));
    }),
  );

  return router;
}
