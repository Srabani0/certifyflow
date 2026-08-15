import type { Role } from '@prisma/client';
import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';
import { verifyToken } from '../lib/jwt';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[env.COOKIE_NAME];
  if (!token) {
    next(AppError.unauthorized('Authentication required'));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.auth = { userId: payload.userId, organizationId: payload.organizationId, role: payload.role };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired session'));
  }
};

export function requireRole(...allowed: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth || !allowed.includes(req.auth.role)) {
      next(AppError.forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}
