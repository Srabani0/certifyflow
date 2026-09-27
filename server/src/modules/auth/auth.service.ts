import crypto from 'node:crypto';
import type { Organization, Role, User } from '@prisma/client';
import { env } from '../../config/env';
import { AppError } from '../../errors/AppError';
import { sendTransactionalEmail } from '../../lib/brevo';
import { prisma } from '../../lib/prisma';
import { comparePassword, hashPassword } from '../../lib/password';
import { escapeHtml } from '../../lib/templateEngine';
import type { LoginInput, RegisterInput } from './auth.schema';

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

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

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
    },
  });

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
  try {
    await sendTransactionalEmail({
      to: { email: user.email, name: user.fullName },
      subject: 'Reset your CertifyFlow password',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
          <p>Hi ${escapeHtml(user.fullName)},</p>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}">${escapeHtml(resetUrl)}</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `.trim(),
    });
  } catch (error) {
    // Don't let a misconfigured/failing email provider leak whether this address has an
    // account, or block the (already-generic) response — just log it server-side.
    // eslint-disable-next-line no-console
    console.error('Failed to send password reset email:', error);
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { passwordResetTokenHash: hashResetToken(token), passwordResetExpiresAt: { gt: new Date() } },
  });
  if (!user) {
    throw AppError.badRequest('This reset link is invalid or has expired');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetTokenHash: null, passwordResetExpiresAt: null },
  });
}
