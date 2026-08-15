import type { CertificateType, Prisma } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import { getTemplateOrThrow } from '../certificateTemplates/certificateTemplates.service';
import { getOwnedEventOrThrow } from '../events/events.service';
import type { CreateCertificateTypeInput, UpdateCertificateTypeInput } from './certificateTypes.schema';

function normalizeSignatories(
  signatories: CreateCertificateTypeInput['signatories'] | undefined,
): Prisma.InputJsonValue | undefined {
  if (!signatories) {
    return undefined;
  }
  return signatories.map((signatory) => ({
    name: signatory.name,
    designation: signatory.designation,
    signatureImageUrl: signatory.signatureImageUrl || null,
  }));
}

export async function getOwnedCertificateTypeOrThrow(
  organizationId: string,
  eventId: string,
  certificateTypeId: string,
): Promise<CertificateType> {
  await getOwnedEventOrThrow(organizationId, eventId);

  const certificateType = await prisma.certificateType.findUnique({ where: { id: certificateTypeId } });
  if (!certificateType || certificateType.eventId !== eventId) {
    throw AppError.notFound('Certificate type not found');
  }
  return certificateType;
}

export async function createCertificateType(
  organizationId: string,
  eventId: string,
  input: CreateCertificateTypeInput,
): Promise<CertificateType> {
  await getOwnedEventOrThrow(organizationId, eventId);
  await getTemplateOrThrow(input.certificateTemplateId);

  return prisma.certificateType.create({
    data: {
      eventId,
      certificateTemplateId: input.certificateTemplateId,
      name: input.name,
      title: input.title,
      description: input.description || null,
      signatories: normalizeSignatories(input.signatories),
    },
  });
}

export async function listCertificateTypes(organizationId: string, eventId: string): Promise<CertificateType[]> {
  await getOwnedEventOrThrow(organizationId, eventId);
  return prisma.certificateType.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
  });
}

export function getCertificateType(
  organizationId: string,
  eventId: string,
  certificateTypeId: string,
): Promise<CertificateType> {
  return getOwnedCertificateTypeOrThrow(organizationId, eventId, certificateTypeId);
}

export async function updateCertificateType(
  organizationId: string,
  eventId: string,
  certificateTypeId: string,
  input: UpdateCertificateTypeInput,
): Promise<CertificateType> {
  await getOwnedCertificateTypeOrThrow(organizationId, eventId, certificateTypeId);

  if (input.certificateTemplateId) {
    await getTemplateOrThrow(input.certificateTemplateId);
  }

  return prisma.certificateType.update({
    where: { id: certificateTypeId },
    data: {
      ...(input.certificateTemplateId !== undefined && { certificateTemplateId: input.certificateTemplateId }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description || null }),
      ...(input.signatories !== undefined && { signatories: normalizeSignatories(input.signatories) }),
    },
  });
}

export async function deleteCertificateType(
  organizationId: string,
  eventId: string,
  certificateTypeId: string,
): Promise<void> {
  await getOwnedCertificateTypeOrThrow(organizationId, eventId, certificateTypeId);
  await prisma.certificateType.delete({ where: { id: certificateTypeId } });
}
