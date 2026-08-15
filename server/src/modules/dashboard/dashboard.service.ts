import { prisma } from '../../lib/prisma';

export interface DashboardSummary {
  totalEvents: number;
  activeEvents: number;
  totalParticipants: number;
  totalCertificatesIssued: number;
  totalVerifications: number;
  recentEvents: { id: string; name: string; status: string; createdAt: Date }[];
  recentCertificates: {
    id: string;
    certificateId: string;
    participantName: string;
    eventName: string;
    issuedAt: Date;
  }[];
}

export async function getDashboardSummary(organizationId: string): Promise<DashboardSummary> {
  const [totalEvents, activeEvents, totalParticipants, certificatesAgg, recentEvents, recentCertificates] =
    await Promise.all([
      prisma.event.count({ where: { organizationId } }),
      prisma.event.count({ where: { organizationId, status: 'ACTIVE' } }),
      prisma.participant.count({ where: { event: { organizationId } } }),
      prisma.certificate.aggregate({
        where: { organizationId },
        _count: { _all: true },
        _sum: { verificationCount: true },
      }),
      prisma.event.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, status: true, createdAt: true },
      }),
      prisma.certificate.findMany({
        where: { organizationId },
        orderBy: { issuedAt: 'desc' },
        take: 5,
        include: {
          participant: { select: { fullName: true } },
          event: { select: { name: true } },
        },
      }),
    ]);

  return {
    totalEvents,
    activeEvents,
    totalParticipants,
    totalCertificatesIssued: certificatesAgg._count._all,
    totalVerifications: certificatesAgg._sum.verificationCount ?? 0,
    recentEvents,
    recentCertificates: recentCertificates.map((certificate) => ({
      id: certificate.id,
      certificateId: certificate.certificateId,
      participantName: certificate.participant.fullName,
      eventName: certificate.event.name,
      issuedAt: certificate.issuedAt,
    })),
  };
}
