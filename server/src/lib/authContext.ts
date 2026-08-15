import type { Role } from '@prisma/client';
import type { Request } from 'express';
import { AppError } from '../errors/AppError';

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: Role;
}

export function requireAuthContext(req: Request): AuthContext {
  if (!req.auth) {
    throw AppError.unauthorized();
  }
  return req.auth;
}
