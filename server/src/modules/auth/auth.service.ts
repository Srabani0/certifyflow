import type { Organization } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import { comparePassword, hashPassword } from '../../lib/password';
import type { LoginInput, RegisterInput } from './auth.schema';

export type SafeOrganization = Omit<Organization, 'passwordHash'>;

export function toSafeOrganization(organization: Organization): SafeOrganization {
  const { passwordHash: _passwordHash, ...safe } = organization;
  return safe;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'org'
  );
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;

  // Collisions are rare; a short linear probe keeps this simple without a retry-loop abstraction.
  while (await prisma.organization.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

export async function registerOrganization(input: RegisterInput): Promise<SafeOrganization> {
  const existing = await prisma.organization.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) {
    throw AppError.conflict('An organization with this email already exists');
  }

  const [slug, passwordHash] = await Promise.all([
    generateUniqueSlug(input.organizationName),
    hashPassword(input.password),
  ]);

  const organization = await prisma.organization.create({
    data: {
      name: input.organizationName,
      slug,
      email: input.email,
      passwordHash,
      website: input.website || null,
    },
  });

  return toSafeOrganization(organization);
}

export async function authenticateOrganization(input: LoginInput): Promise<SafeOrganization> {
  const organization = await prisma.organization.findUnique({ where: { email: input.email } });
  if (!organization) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await comparePassword(input.password, organization.passwordHash);
  if (!passwordMatches) {
    throw AppError.unauthorized('Invalid email or password');
  }

  return toSafeOrganization(organization);
}

export async function getOrganizationById(organizationId: string): Promise<SafeOrganization> {
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!organization) {
    throw AppError.unauthorized('Session is no longer valid');
  }
  return toSafeOrganization(organization);
}
