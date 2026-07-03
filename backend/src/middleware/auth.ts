import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { HttpError } from '../lib/http';
import { env } from '../config';

type TokenPayload = {
  sub: string;
  role: UserRole;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, 'Missing token'));
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, 'Invalid token'));
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(new HttpError(401, 'Missing token'));
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(new HttpError(403, 'Forbidden'));
      return;
    }

    next();
  };
}
