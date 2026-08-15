import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { signToken } from '../../lib/jwt';
import { AppError } from '../../errors/AppError';
import { authenticateOrganization, getOrganizationById, registerOrganization } from './auth.service';
import { loginSchema, registerSchema } from './auth.schema';
import { clearAuthCookie, setAuthCookie } from './cookie';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const organization = await registerOrganization(input);
  const token = signToken({ organizationId: organization.id });
  setAuthCookie(res, token);
  res.status(201).json({ organization });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const organization = await authenticateOrganization(input);
  const token = signToken({ organizationId: organization.id });
  setAuthCookie(res, token);
  res.status(200).json({ organization });
});

export const logout = (_req: Request, res: Response): void => {
  clearAuthCookie(res);
  res.status(204).send();
};

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.organizationId) {
    throw AppError.unauthorized();
  }
  const organization = await getOrganizationById(req.organizationId);
  res.status(200).json({ organization });
});
