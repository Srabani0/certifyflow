import type { Organization, Role, User } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import { comparePassword, hashPassword } from '../../lib/password';
import type { LoginInput, RegisterInput } from './auth.schema';

export type SafeUser = Omit<User, 'passwordHash'>;

export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export interface AuthResult {
  user: SafeUser;
  organization: Organization;
  role: Role;
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

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  const [slug, passwordHash] = await Promise.all([
    generateUniqueSlug(input.organizationName),
    hashPassword(input.password),
  ]);

  const { user, organization } = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        passwordHash,
      },
    });
    const createdOrganization = await tx.organization.create({
      data: {
        name: input.organizationName,
        slug,
        website: input.website || null,
      },
    });
    await tx.organizationMember.create({
      data: {
        userId: createdUser.id,
        organizationId: createdOrganization.id,
        role: 'OWNER',
      },
    });
    return { user: createdUser, organization: createdOrganization };
  });

  return { user: toSafeUser(user), organization, role: 'OWNER' };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await comparePassword(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!membership) {
    throw AppError.unauthorized('No organization membership found');
  }

  return { user: toSafeUser(user), organization: membership.organization, role: membership.role };
}

export async function getAuthContext(userId: string, organizationId: string): Promise<AuthResult> {
  const [user, membership] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: { organization: true },
    }),
  ]);

  if (!user || !membership) {
    throw AppError.unauthorized('Session is no longer valid');
  }

  return { user: toSafeUser(user), organization: membership.organization, role: membership.role };
}
