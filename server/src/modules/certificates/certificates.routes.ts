import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import {
  bulkSendEmail,
  download,
  downloadZip,
  exportCsv,
  generate,
  list,
  listBatchHistory,
  previewGenerate,
  refreshEmail,
  revoke,
  sendEmail,
  test,
} from './certificates.controller';

export const certificatesRouter = Router({ mergeParams: true });

certificatesRouter.use(requireAuth);

certificatesRouter.post('/test', test);
certificatesRouter.post('/generate/preview', previewGenerate);
certificatesRouter.post('/generate', generate);
certificatesRouter.get('/batches', listBatchHistory);
certificatesRouter.post('/download-zip', downloadZip);
certificatesRouter.post('/email', bulkSendEmail);
certificatesRouter.get('/', list);
certificatesRouter.get('/export.csv', exportCsv);
certificatesRouter.get('/:certificateRecordId/download', download);
certificatesRouter.patch('/:certificateRecordId/revoke', revoke);
certificatesRouter.post('/:certificateRecordId/email', sendEmail);
certificatesRouter.post('/:certificateRecordId/email/refresh', refreshEmail);
