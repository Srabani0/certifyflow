import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { list } from './auditLogs.controller';

export const auditLogsRouter = Router();

auditLogsRouter.use(requireAuth);

auditLogsRouter.get('/', list);
