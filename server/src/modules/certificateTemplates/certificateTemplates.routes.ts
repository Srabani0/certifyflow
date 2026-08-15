import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getOne, list } from './certificateTemplates.controller';

export const certificateTemplatesRouter = Router();

certificateTemplatesRouter.use(requireAuth);

certificateTemplatesRouter.get('/', list);
certificateTemplatesRouter.get('/:templateId', getOne);
