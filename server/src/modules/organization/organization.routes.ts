import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth';
import { update, uploadLogo } from './organization.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const organizationRouter = Router();

organizationRouter.use(requireAuth);

organizationRouter.patch('/', update);
organizationRouter.post('/logo', upload.single('logo'), uploadLogo);
