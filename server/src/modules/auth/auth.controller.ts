import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuthContext } from '../../lib/authContext';
import { signToken } from '../../lib/jwt';
import { getAuthContext, login as loginUser, register as registerUser } from './auth.service';
import { loginSchema, registerSchema } from './auth.schema';
import { clearAuthCookie, setAuthCookie } from './cookie';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const result = await registerUser(input);
  const token = signToken({ userId: result.user.id, organizationId: result.organization.id, role: result.role });
  setAuthCookie(res, token);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input);
  const token = signToken({ userId: result.user.id, organizationId: result.organization.id, role: result.role });
  setAuthCookie(res, token);
  res.status(200).json(result);
});

export const logout = (_req: Request, res: Response): void => {
  clearAuthCookie(res);
  res.status(204).send();
};

export const me = asyncHandler(async (req: Request, res: Response) => {
  const auth = requireAuthContext(req);
  const result = await getAuthContext(auth.userId, auth.organizationId);
  res.status(200).json(result);
});
