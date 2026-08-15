import { Router } from 'express';
import { downloadVerified, verify } from './verify.controller';

export const verifyRouter = Router();

verifyRouter.get('/:certificateId', verify);
verifyRouter.get('/:certificateId/download', downloadVerified);
