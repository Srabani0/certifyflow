import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth';
import { bulkAssign, create, getOne, importCsv, list, remove, update } from './participants.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const participantsRouter = Router({ mergeParams: true });

participantsRouter.use(requireAuth);

participantsRouter.post('/', create);
participantsRouter.get('/', list);
participantsRouter.post('/import', upload.single('file'), importCsv);
participantsRouter.patch('/assign-certificate-type', bulkAssign);
participantsRouter.get('/:participantId', getOne);
participantsRouter.patch('/:participantId', update);
participantsRouter.delete('/:participantId', remove);
