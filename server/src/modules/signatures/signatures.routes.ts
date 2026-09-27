import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../middleware/auth';
import { create, list, remove } from './signatures.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const signaturesRouter = Router();

signaturesRouter.use(requireAuth);

signaturesRouter.get('/', list);
signaturesRouter.post('/', requireRole('OWNER', 'ADMIN'), upload.single('image'), create);
signaturesRouter.delete('/:signatureId', requireRole('OWNER', 'ADMIN'), remove);
