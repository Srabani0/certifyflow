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
    req.organizationId = payload.organizationId;
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired session'));
  }
};
