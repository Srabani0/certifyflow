import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { create, getOne, list, remove, update } from './certificateTypes.controller';

export const certificateTypesRouter = Router({ mergeParams: true });

certificateTypesRouter.use(requireAuth);

certificateTypesRouter.post('/', create);
certificateTypesRouter.get('/', list);
certificateTypesRouter.get('/:certificateTypeId', getOne);
certificateTypesRouter.patch('/:certificateTypeId', update);
certificateTypesRouter.delete('/:certificateTypeId', remove);
