import type { Organization } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import type { UpdateOrganizationInput } from './organization.schema';

export async function updateOrganizationProfile(
  organizationId: string,
  input: UpdateOrganizationInput,
): Promise<Organization> {
  return prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.website !== undefined && { website: input.website || null }),
      ...(input.brandColor !== undefined && { brandColor: input.brandColor || null }),
      ...(input.address !== undefined && { address: input.address || null }),
      ...(input.phone !== undefined && { phone: input.phone || null }),
      ...(input.certificateIdPrefix !== undefined && { certificateIdPrefix: input.certificateIdPrefix }),
    },
  });
}

export async function setOrganizationLogo(organizationId: string, logoUrl: string): Promise<Organization> {
  return prisma.organization.update({
    where: { id: organizationId },
    data: { logoUrl },
  });
}
