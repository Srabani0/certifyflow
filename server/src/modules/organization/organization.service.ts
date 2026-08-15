import { prisma } from '../../lib/prisma';
import { toSafeOrganization, type SafeOrganization } from '../auth/auth.service';
import type { UpdateOrganizationInput } from './organization.schema';

export async function updateOrganizationProfile(
  organizationId: string,
  input: UpdateOrganizationInput,
): Promise<SafeOrganization> {
  const organization = await prisma.organization.update({
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
  return toSafeOrganization(organization);
}

export async function setOrganizationLogo(organizationId: string, logoUrl: string): Promise<SafeOrganization> {
  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: { logoUrl },
  });
  return toSafeOrganization(organization);
}
