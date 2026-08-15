import 'express';
import type { AuthContext } from '../lib/authContext';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export {};
