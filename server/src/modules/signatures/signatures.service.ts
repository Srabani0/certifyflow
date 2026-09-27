import type { Signature } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import type { CreateSignatureInput } from './signatures.schema';

export function listSignatures(organizationId: string): Promise<Signature[]> {
  return prisma.signature.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
}

export function createSignatureRow(organizationId: string, input: CreateSignatureInput): Promise<Signature> {
  return prisma.signature.create({
    data: { organizationId, name: input.name, designation: input.designation },
  });
}

export function setSignatureImage(signatureId: string, imageUrl: string): Promise<Signature> {
  return prisma.signature.update({ where: { id: signatureId }, data: { imageUrl } });
}

async function getOwnedSignatureOrThrow(organizationId: string, signatureId: string): Promise<Signature> {
  const signature = await prisma.signature.findUnique({ where: { id: signatureId } });
  if (!signature || signature.organizationId !== organizationId) {
    throw AppError.notFound('Signature not found');
  }
  return signature;
}

export async function deleteSignature(organizationId: string, signatureId: string): Promise<void> {
  await getOwnedSignatureOrThrow(organizationId, signatureId);
  await prisma.signature.delete({ where: { id: signatureId } });
}
