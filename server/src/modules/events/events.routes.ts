import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { certificateTypesRouter } from '../certificateTypes/certificateTypes.routes';
import { certificatesRouter } from '../certificates/certificates.routes';
import { participantsRouter } from '../participants/participants.routes';
import { create, getOne, list, remove, update } from './events.controller';

export const eventsRouter = Router();

eventsRouter.use(requireAuth);

eventsRouter.post('/', create);
eventsRouter.get('/', list);
eventsRouter.get('/:eventId', getOne);
eventsRouter.patch('/:eventId', update);
eventsRouter.delete('/:eventId', remove);

eventsRouter.use('/:eventId/participants', participantsRouter);
eventsRouter.use('/:eventId/certificate-types', certificateTypesRouter);
eventsRouter.use('/:eventId/certificates', certificatesRouter);
