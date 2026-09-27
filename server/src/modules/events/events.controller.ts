import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { recordAuditLog } from '../../lib/auditLog';
import { requireAuthContext } from '../../lib/authContext';
import { createEventSchema, listEventsQuerySchema, updateEventSchema } from './events.schema';
import { createEvent, deleteEvent, getEvent, listEvents, updateEvent } from './events.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { userId, organizationId } = requireAuthContext(req);
  const input = createEventSchema.parse(req.body);
  const event = await createEvent(organizationId, input);
  await recordAuditLog(organizationId, userId, 'event.created', { type: 'event', id: event.id }, { name: event.name });
  res.status(201).json({ event });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const query = listEventsQuerySchema.parse(req.query);
  const events = await listEvents(organizationId, query);
  res.status(200).json({ events });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const event = await getEvent(organizationId, req.params.eventId);
  res.status(200).json({ event });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { userId, organizationId } = requireAuthContext(req);
  const input = updateEventSchema.parse(req.body);
  const event = await updateEvent(organizationId, req.params.eventId, input);
  await recordAuditLog(organizationId, userId, 'event.updated', { type: 'event', id: event.id });
  res.status(200).json({ event });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { userId, organizationId } = requireAuthContext(req);
  await deleteEvent(organizationId, req.params.eventId);
  await recordAuditLog(organizationId, userId, 'event.deleted', { type: 'event', id: req.params.eventId });
  res.status(204).send();
});
