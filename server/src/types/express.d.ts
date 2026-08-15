import 'express';

declare global {
  namespace Express {
    interface Request {
      organizationId?: string;
    }
  }
}

export {};
