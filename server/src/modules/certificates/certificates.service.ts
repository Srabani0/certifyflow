import type { Certificate, Organization, Prisma } from '@prisma/client';
import archiver from 'archiver';
import type { Response } from 'express';
import { AppError } from '../../errors/AppError';
import { generateCertificateId } from '../../lib/certificateId';
import { stringifyCsv } from '../../lib/csv';
import { prisma } from '../../lib/prisma';
import { readFile, saveFile } from '../../lib/storage';
import { getOwnedCertificateTypeOrThrow } from '../certificateTypes/certificateTypes.service';
import { getOwnedEventOrThrow } from '../events/events.service';
import type { ListCertificatesQuery } from './certificates.schema';
import { renderCertificatePdf } from './pdf.service';

async function generateUniqueCertificateId(prefix: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateCertificateId(prefix);
    // eslint-disable-next-line no-await-in-loop
    const existing = await prisma.certificate.findUnique({
      where: { certificateId: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }
  throw AppError.conflict('Could not generate a unique certificate ID, please retry');
}

interface ParticipantForGeneration {
  id: string;
  fullName: string;
  certificateTypeId: string | null;
  metadata: unknown;
}

interface GenerateForParticipantResult {
  participantId: string;
  certificate?: Certificate;
  skippedReason?: string;
}

async function generateForParticipant(
  organization: Pick<Organization, 'id' | 'name' | 'logoUrl' | 'certificateIdPrefix'>,
  event: { id: string; name: string; location: string | null; startDate: Date | null; endDate: Date | null },
  participant: ParticipantForGeneration,
): Promise<GenerateForParticipantResult> {
  if (!participant.certificateTypeId) {
    return { participantId: participant.id, skippedReason: 'No certificate type assigned' };
  }

  const existing = await prisma.certificate.findUnique({ where: { participantId: participant.id } });
  if (existing) {
    return { participantId: participant.id, skippedReason: 'Certificate already generated' };
  }

  const certificateType = await prisma.certificateType.findUnique({
    where: { id: participant.certificateTypeId },
    include: { certificateTemplate: true },
  });
  if (!certificateType) {
    return { participantId: participant.id, skippedReason: 'Certificate type no longer exists' };
  }

  const certificateId = await generateUniqueCertificateId(organization.certificateIdPrefix);
  const issuedAt = new Date();

  const pdfBuffer = await renderCertificatePdf({
    organizationName: organization.name,
    organizationLogoUrl: organization.logoUrl,
    eventName: event.name,
    eventVenue: event.location,
    eventStartDate: event.startDate,
    eventEndDate: event.endDate,
    certificateType,
    template: certificateType.certificateTemplate,
    participantName: participant.fullName,
    participantMetadata: participant.metadata,
    certificateId,
    issuedAt,
  });

  const relativePdfPath = `${organization.id}/${event.id}/${certificateId}.pdf`;
  await saveFile('certificates', relativePdfPath, pdfBuffer);

  const certificate = await prisma.certificate.create({
    data: {
      certificateId,
      organizationId: organization.id,
      eventId: event.id,
      certificateTypeId: certificateType.id,
      participantId: participant.id,
      pdfPath: relativePdfPath,
      issuedAt,
    },
  });

  return { participantId: participant.id, certificate };
}

export interface BatchGenerateResult {
  requested: number;
  generated: Certificate[];
  skipped: { participantId: string; reason: string }[];
}

export async function batchGenerateCertificates(
  organizationId: string,
  eventId: string,
  participantIds: string[] | undefined,
): Promise<BatchGenerateResult> {
  const event = await getOwnedEventOrThrow(organizationId, eventId);
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });

  const participants = await prisma.participant.findMany({
    where: {
      eventId,
      ...(participantIds ? { id: { in: participantIds } } : {}),
    },
  });

  const results: GenerateForParticipantResult[] = [];
  for (const participant of participants) {
    // Sequential on purpose: reuses one warm browser instance instead of spawning many pages at once.
    // eslint-disable-next-line no-await-in-loop
    const result = await generateForParticipant(organization, event, participant);
    results.push(result);
  }

  return {
    requested: participants.length,
    generated: results.flatMap((r) => (r.certificate ? [r.certificate] : [])),
    skipped: results.flatMap((r) => (r.skippedReason ? [{ participantId: r.participantId, reason: r.skippedReason }] : [])),
  };
}

export async function generateTestCertificate(
  organizationId: string,
  eventId: string,
  certificateTypeId: string,
  participantId: string | undefined,
): Promise<Buffer> {
  const event = await getOwnedEventOrThrow(organizationId, eventId);
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
  const certificateType = await getOwnedCertificateTypeOrThrow(organizationId, eventId, certificateTypeId);
  const template = await prisma.certificateTemplate.findUniqueOrThrow({
    where: { id: certificateType.certificateTemplateId },
  });

  let participantName = 'Jordan Sample';
  let participantMetadata: unknown = undefined;
  if (participantId) {
    const participant = await prisma.participant.findUnique({ where: { id: participantId } });
    if (participant && participant.eventId === eventId) {
      participantName = participant.fullName;
      participantMetadata = participant.metadata;
    }
  }

  return renderCertificatePdf({
    organizationName: organization.name,
    organizationLogoUrl: organization.logoUrl,
    eventName: event.name,
    eventVenue: event.location,
    eventStartDate: event.startDate,
    eventEndDate: event.endDate,
    certificateType,
    template,
    participantName,
    participantMetadata,
    certificateId: 'TEST-PREVIEW',
    issuedAt: new Date(),
  });
}

export async function listCertificates(organizationId: string, eventId: string, query: ListCertificatesQuery) {
  await getOwnedEventOrThrow(organizationId, eventId);

  const orderBy: Prisma.CertificateOrderByWithRelationInput =
    query.sort === 'name'
      ? { participant: { fullName: 'asc' } }
      : query.sort === 'oldest'
        ? { issuedAt: 'asc' }
        : { issuedAt: 'desc' };

  return prisma.certificate.findMany({
    where: {
      eventId,
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { certificateId: { contains: query.search, mode: 'insensitive' } },
          { participant: { fullName: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    },
    orderBy,
    include: {
      participant: { select: { id: true, fullName: true, email: true } },
      certificateType: { select: { id: true, name: true, title: true } },
    },
  });
}

export async function exportCertificatesCsv(
  organizationId: string,
  eventId: string,
  query: ListCertificatesQuery,
): Promise<string> {
  const certificates = await listCertificates(organizationId, eventId, query);

  const headers = ['Certificate ID', 'Participant Name', 'Email', 'Certificate Type', 'Status', 'Issued At', 'Verifications'];
  const rows = certificates.map((certificate) => [
    certificate.certificateId,
    certificate.participant.fullName,
    certificate.participant.email ?? '',
    certificate.certificateType.name,
    certificate.status,
    certificate.issuedAt.toISOString(),
    certificate.verificationCount,
  ]);

  return stringifyCsv(headers, rows);
}

export async function getOwnedCertificateOrThrow(
  organizationId: string,
  eventId: string,
  certificateRecordId: string,
): Promise<Certificate> {
  await getOwnedEventOrThrow(organizationId, eventId);
  const certificate = await prisma.certificate.findUnique({ where: { id: certificateRecordId } });
  if (!certificate || certificate.eventId !== eventId) {
    throw AppError.notFound('Certificate not found');
  }
  return certificate;
}

export async function getCertificatePdfBuffer(
  organizationId: string,
  eventId: string,
  certificateRecordId: string,
): Promise<{ certificate: Certificate; buffer: Buffer }> {
  const certificate = await getOwnedCertificateOrThrow(organizationId, eventId, certificateRecordId);
  const buffer = await readFile('certificates', certificate.pdfPath);
  return { certificate, buffer };
}

export async function revokeCertificate(
  organizationId: string,
  eventId: string,
  certificateRecordId: string,
): Promise<Certificate> {
  await getOwnedCertificateOrThrow(organizationId, eventId, certificateRecordId);
  return prisma.certificate.update({
    where: { id: certificateRecordId },
    data: { status: 'REVOKED', revokedAt: new Date() },
  });
}

export async function streamCertificatesZip(
  organizationId: string,
  eventId: string,
  certificateIds: string[] | undefined,
  res: Response,
): Promise<void> {
  await getOwnedEventOrThrow(organizationId, eventId);

  const certificates = await prisma.certificate.findMany({
    where: {
      eventId,
      ...(certificateIds ? { id: { in: certificateIds } } : {}),
    },
    include: { participant: { select: { fullName: true } } },
  });

  if (certificates.length === 0) {
    throw AppError.notFound('No certificates found to download');
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="certificates-${eventId}.zip"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  for (const certificate of certificates) {
    // eslint-disable-next-line no-await-in-loop
    const buffer = await readFile('certificates', certificate.pdfPath);
    const safeName = certificate.participant.fullName.replace(/[^a-z0-9]+/gi, '-');
    archive.append(buffer, { name: `${safeName}-${certificate.certificateId}.pdf` });
  }

  await archive.finalize();
}
