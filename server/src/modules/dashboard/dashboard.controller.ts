import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuthContext } from '../../lib/authContext';
import { getDashboardSummary } from './dashboard.service';

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const data = await getDashboardSummary(organizationId);
  res.status(200).json(data);
});
