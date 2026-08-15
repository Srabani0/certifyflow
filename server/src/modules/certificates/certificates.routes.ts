import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { download, downloadZip, exportCsv, generate, list, revoke, test } from './certificates.controller';

export const certificatesRouter = Router({ mergeParams: true });

certificatesRouter.use(requireAuth);

certificatesRouter.post('/test', test);
certificatesRouter.post('/generate', generate);
certificatesRouter.post('/download-zip', downloadZip);
certificatesRouter.get('/', list);
certificatesRouter.get('/export.csv', exportCsv);
certificatesRouter.get('/:certificateRecordId/download', download);
certificatesRouter.patch('/:certificateRecordId/revoke', revoke);
