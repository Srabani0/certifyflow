import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuthContext } from '../../lib/authContext';
import { listAuditLogs } from './auditLogs.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const logs = await listAuditLogs(organizationId);
  res.status(200).json({ logs });
});
