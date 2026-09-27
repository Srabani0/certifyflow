import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export async function recordAuditLog(
  organizationId: string,
  userId: string | null,
  action: string,
  target?: { type: string; id: string },
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action,
        targetType: target?.type,
        targetId: target?.id,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    // Never let audit logging break the request it's logging.
    // eslint-disable-next-line no-console
    console.error('Failed to record audit log:', error);
  }
}
