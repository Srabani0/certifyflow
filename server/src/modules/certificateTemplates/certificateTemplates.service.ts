import type { CertificateTemplate } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { prisma } from '../../lib/prisma';

export function listActiveTemplates(): Promise<CertificateTemplate[]> {
  return prisma.certificateTemplate.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function getTemplateOrThrow(templateId: string): Promise<CertificateTemplate> {
  const template = await prisma.certificateTemplate.findUnique({ where: { id: templateId } });
  if (!template || !template.isActive) {
    throw AppError.notFound('Certificate template not found');
  }
  return template;
}
