import type { Event, Prisma } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import type { CreateEventInput, ListEventsQuery, UpdateEventInput } from './events.schema';

export async function getOwnedEventOrThrow(organizationId: string, eventId: string): Promise<Event> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.organizationId !== organizationId) {
    throw AppError.notFound('Event not found');
  }
  return event;
}

export function createEvent(organizationId: string, input: CreateEventInput): Promise<Event> {
  return prisma.event.create({
    data: {
      organizationId,
      name: input.name,
      description: input.description || null,
      type: input.type,
      status: input.status,
      startDate: input.startDate,
      endDate: input.endDate,
      location: input.location || null,
    },
  });
}

export function listEvents(organizationId: string, query: ListEventsQuery) {
  const orderBy: Prisma.EventOrderByWithRelationInput =
    query.sort === 'name' ? { name: 'asc' } : query.sort === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

  return prisma.event.findMany({
    where: {
      organizationId,
      ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
      ...(query.status && { status: query.status }),
      ...(query.type && { type: query.type }),
    },
    orderBy,
    include: { _count: { select: { participants: true, certificates: true } } },
  });
}

export async function getEvent(organizationId: string, eventId: string): Promise<Event> {
  return getOwnedEventOrThrow(organizationId, eventId);
}

export async function updateEvent(organizationId: string, eventId: string, input: UpdateEventInput): Promise<Event> {
  await getOwnedEventOrThrow(organizationId, eventId);

  return prisma.event.update({
    where: { id: eventId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description || null }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.location !== undefined && { location: input.location || null }),
    },
  });
}

export async function deleteEvent(organizationId: string, eventId: string): Promise<void> {
  await getOwnedEventOrThrow(organizationId, eventId);
  await prisma.event.delete({ where: { id: eventId } });
}
