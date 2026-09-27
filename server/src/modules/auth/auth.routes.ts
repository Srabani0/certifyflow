import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { forgotPassword, login, logout, me, register, resetPasswordHandler } from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPasswordHandler);
authRouter.get('/me', requireAuth, me);
