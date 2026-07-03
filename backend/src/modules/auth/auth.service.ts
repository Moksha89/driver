import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { PrismaClient } from '@prisma/client';
import { env } from '../../config';
import { HttpError } from '../../lib/http';
import { pickUser } from '../../lib/format';

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async login(phone: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return {
      token,
      user: pickUser(user),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new HttpError(404, 'User not found');
    }
    return pickUser(user);
  }
}
