import { EventStatus, EventType } from '@prisma/client';
import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().trim().min(2, 'Event name must be at least 2 characters').max(160),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  type: z.nativeEnum(EventType).default('OTHER'),
  status: z.nativeEnum(EventStatus).default('DRAFT'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  location: z.string().trim().max(200).optional().or(z.literal('')),
});

export const updateEventSchema = createEventSchema.partial();

export const listEventsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.nativeEnum(EventStatus).optional(),
  type: z.nativeEnum(EventType).optional(),
  sort: z.enum(['newest', 'oldest', 'name']).default('newest'),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
