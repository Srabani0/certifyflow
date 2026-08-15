import type { Participant, Prisma } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { csvRowsToRecords, parseCsv } from '../../lib/csv';
import { prisma } from '../../lib/prisma';
import { getOwnedCertificateTypeOrThrow } from '../certificateTypes/certificateTypes.service';
import { getOwnedEventOrThrow } from '../events/events.service';
import type { AddParticipantInput, UpdateParticipantInput } from './participants.schema';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_HEADER_CANDIDATES = ['name', 'full name', 'fullname', 'participant name', 'student name'];
const EMAIL_HEADER_CANDIDATES = ['email', 'email address', 'e-mail'];

export interface CsvImportError {
  row: number;
  reason: string;
}

export interface CsvImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: CsvImportError[];
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function findHeader(headers: string[], candidates: string[]): string | undefined {
  return headers.find((header) => candidates.includes(normalizeHeader(header)));
}

export async function getOwnedParticipantOrThrow(
  organizationId: string,
  eventId: string,
  participantId: string,
): Promise<Participant> {
  await getOwnedEventOrThrow(organizationId, eventId);

  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant || participant.eventId !== eventId) {
    throw AppError.notFound('Participant not found');
  }
  return participant;
}

export async function addParticipant(
  organizationId: string,
  eventId: string,
  input: AddParticipantInput,
): Promise<Participant> {
  await getOwnedEventOrThrow(organizationId, eventId);

  const email = input.email || null;
  if (email) {
    const existing = await prisma.participant.findFirst({ where: { eventId, email } });
    if (existing) {
      throw AppError.conflict('A participant with this email already exists in this event');
    }
  }

  if (input.certificateTypeId) {
    await getOwnedCertificateTypeOrThrow(organizationId, eventId, input.certificateTypeId);
  }

  return prisma.participant.create({
    data: {
      eventId,
      fullName: input.fullName,
      email,
      certificateTypeId: input.certificateTypeId || null,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listParticipants(organizationId: string, eventId: string) {
  await getOwnedEventOrThrow(organizationId, eventId);
  return prisma.participant.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
    include: { certificateType: { select: { id: true, name: true } } },
  });
}

export function getParticipant(organizationId: string, eventId: string, participantId: string): Promise<Participant> {
  return getOwnedParticipantOrThrow(organizationId, eventId, participantId);
}

export async function updateParticipant(
  organizationId: string,
  eventId: string,
  participantId: string,
  input: UpdateParticipantInput,
): Promise<Participant> {
  await getOwnedParticipantOrThrow(organizationId, eventId, participantId);

  if (input.email) {
    const existing = await prisma.participant.findFirst({
      where: { eventId, email: input.email, NOT: { id: participantId } },
    });
    if (existing) {
      throw AppError.conflict('A participant with this email already exists in this event');
    }
  }

  if (input.certificateTypeId) {
    await getOwnedCertificateTypeOrThrow(organizationId, eventId, input.certificateTypeId);
  }

  return prisma.participant.update({
    where: { id: participantId },
    data: {
      ...(input.fullName !== undefined && { fullName: input.fullName }),
      ...(input.email !== undefined && { email: input.email || null }),
      ...(input.certificateTypeId !== undefined && { certificateTypeId: input.certificateTypeId || null }),
      ...(input.metadata !== undefined && { metadata: input.metadata as Prisma.InputJsonValue }),
    },
  });
}

export async function deleteParticipant(organizationId: string, eventId: string, participantId: string): Promise<void> {
  await getOwnedParticipantOrThrow(organizationId, eventId, participantId);
  await prisma.participant.delete({ where: { id: participantId } });
}

export async function bulkAssignCertificateType(
  organizationId: string,
  eventId: string,
  participantIds: string[],
  certificateTypeId: string,
): Promise<number> {
  await getOwnedEventOrThrow(organizationId, eventId);
  await getOwnedCertificateTypeOrThrow(organizationId, eventId, certificateTypeId);

  const result = await prisma.participant.updateMany({
    where: { eventId, id: { in: participantIds } },
    data: { certificateTypeId },
  });
  return result.count;
}

export async function importParticipantsFromCsv(
  organizationId: string,
  eventId: string,
  csvBuffer: Buffer,
): Promise<CsvImportResult> {
  await getOwnedEventOrThrow(organizationId, eventId);

  const { headers, records } = csvRowsToRecords(parseCsv(csvBuffer.toString('utf8')));

  if (headers.length === 0 || records.length === 0) {
    throw AppError.badRequest('The CSV file is empty');
  }

  const nameHeader = findHeader(headers, NAME_HEADER_CANDIDATES);
  if (!nameHeader) {
    throw AppError.badRequest('Could not find a name column (expected a header like "Name" or "Full Name")');
  }
  const emailHeader = findHeader(headers, EMAIL_HEADER_CANDIDATES);
  const metaHeaders = headers.filter((header) => header !== nameHeader && header !== emailHeader);

  const existingParticipants = await prisma.participant.findMany({
    where: { eventId, email: { not: null } },
    select: { email: true },
  });
  const existingEmails = new Set(existingParticipants.map((p) => p.email as string));
  const seenInBatch = new Set<string>();

  const errors: CsvImportError[] = [];
  const validRows: { fullName: string; email: string | null; metadata: Prisma.InputJsonValue | undefined }[] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2; // +1 for 0-index, +1 for the header row
    const fullName = record[nameHeader]?.trim();
    if (!fullName) {
      errors.push({ row: rowNumber, reason: 'Missing name' });
      return;
    }

    const rawEmail = emailHeader ? record[emailHeader]?.trim() : '';
    const email = rawEmail ? rawEmail.toLowerCase() : null;

    if (email) {
      if (!EMAIL_PATTERN.test(email)) {
        errors.push({ row: rowNumber, reason: `Invalid email: ${rawEmail}` });
        return;
      }
      if (existingEmails.has(email) || seenInBatch.has(email)) {
        errors.push({ row: rowNumber, reason: `Duplicate email: ${rawEmail}` });
        return;
      }
      seenInBatch.add(email);
    }

    const metadata: Record<string, string> = {};
    metaHeaders.forEach((header) => {
      const value = record[header];
      if (value) {
        metadata[header] = value;
      }
    });

    validRows.push({
      fullName,
      email,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });
  });

  if (validRows.length > 0) {
    await prisma.participant.createMany({
      data: validRows.map((row) => ({
        eventId,
        fullName: row.fullName,
        email: row.email,
        metadata: row.metadata,
      })),
      skipDuplicates: true,
    });
  }

  return {
    totalRows: records.length,
    imported: validRows.length,
    skipped: errors.length,
    errors,
  };
}
