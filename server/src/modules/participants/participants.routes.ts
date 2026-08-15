import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth';
import {
  bulkAssign,
  confirmImport,
  create,
  exportCsv,
  getOne,
  list,
  previewImport,
  remove,
  update,
} from './participants.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const participantsRouter = Router({ mergeParams: true });

participantsRouter.use(requireAuth);

participantsRouter.post('/', create);
participantsRouter.get('/', list);
participantsRouter.post('/import/preview', upload.single('file'), previewImport);
participantsRouter.post('/import/confirm', confirmImport);
participantsRouter.patch('/assign-certificate-type', bulkAssign);
participantsRouter.get('/export.csv', exportCsv);
participantsRouter.get('/:participantId', getOne);
participantsRouter.patch('/:participantId', update);
participantsRouter.delete('/:participantId', remove);
