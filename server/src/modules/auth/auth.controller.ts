import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuthContext } from '../../lib/authContext';
import { signToken } from '../../lib/jwt';
import {
  getAuthContext,
  login as loginUser,
  register as registerUser,
  requestPasswordReset,
  resetPassword,
} from './auth.service';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from './auth.schema';
import { clearAuthCookie, setAuthCookie } from './cookie';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const result = await registerUser(input);
  const token = signToken({ userId: result.user.id, organizationId: result.organization.id, role: result.role });
  setAuthCookie(res, token);
  res.status(201).json({ ...result, token });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input);
  const token = signToken({ userId: result.user.id, organizationId: result.organization.id, role: result.role });
  setAuthCookie(res, token);
  res.status(200).json({ ...result, token });
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

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const input = forgotPasswordSchema.parse(req.body);
  await requestPasswordReset(input.email);
  res.status(200).json({ message: 'If that email has an account, a reset link has been sent.' });
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = resetPasswordSchema.parse(req.body);
  await resetPassword(input.token, input.password);
  res.status(200).json({ message: 'Password updated. You can now sign in.' });
});
