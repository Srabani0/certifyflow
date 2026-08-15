import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../errors/AppError';
import { getDashboardSummary } from './dashboard.service';

export const summary = asyncHandler(async (req: Request, res: Response) => {
  if (!req.organizationId) {
    throw AppError.unauthorized();
  }
  const data = await getDashboardSummary(req.organizationId);
  res.status(200).json(data);
});
