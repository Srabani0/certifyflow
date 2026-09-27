import { prisma } from '../../lib/prisma';

const AUDIT_LOG_LIMIT = 200;

export interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: unknown;
  createdAt: Date;
  actor: { id: string; fullName: string; email: string } | null;
}

export async function listAuditLogs(organizationId: string): Promise<AuditLogEntry[]> {
  const logs = await prisma.auditLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: AUDIT_LOG_LIMIT,
  });

  const userIds = Array.from(new Set(logs.map((log) => log.userId).filter((id): id is string => Boolean(id))));
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true, email: true } })
      : [];
  const userById = new Map(users.map((user) => [user.id, user]));

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    metadata: log.metadata,
    createdAt: log.createdAt,
    actor: log.userId ? (userById.get(log.userId) ?? null) : null,
  }));
}
