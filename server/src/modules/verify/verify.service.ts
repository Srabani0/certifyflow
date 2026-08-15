import { prisma } from '../../lib/prisma';
import { readFile } from '../../lib/storage';

export interface VerifiedCertificateInfo {
  certificateId: string;
  participantName: string;
  eventName: string;
  organizationName: string;
  certificateTypeName: string;
  certificateTypeTitle: string;
  issuedAt: Date;
  revokedAt: Date | null;
}

export interface VerifyResult {
  valid: boolean;
  reason?: string;
  certificate?: VerifiedCertificateInfo;
}

export async function verifyCertificate(certificateId: string): Promise<VerifyResult> {
  const certificate = await prisma.certificate.findUnique({
    where: { certificateId },
    include: {
      participant: { select: { fullName: true } },
      event: { select: { name: true } },
      organization: { select: { name: true } },
      certificateType: { select: { name: true, title: true } },
    },
  });

  if (!certificate) {
    return { valid: false, reason: 'No certificate found with this ID' };
  }

  const info: VerifiedCertificateInfo = {
    certificateId: certificate.certificateId,
    participantName: certificate.participant.fullName,
    eventName: certificate.event.name,
    organizationName: certificate.organization.name,
    certificateTypeName: certificate.certificateType.name,
    certificateTypeTitle: certificate.certificateType.title,
    issuedAt: certificate.issuedAt,
    revokedAt: certificate.revokedAt,
  };

  if (certificate.status === 'REVOKED') {
    return { valid: false, reason: 'This certificate has been revoked', certificate: info };
  }

  await prisma.certificate
    .update({ where: { id: certificate.id }, data: { verificationCount: { increment: 1 } } })
    .catch(() => undefined);

  return { valid: true, certificate: info };
}

export async function getVerifiedCertificatePdf(certificateId: string): Promise<Buffer | null> {
  const certificate = await prisma.certificate.findUnique({ where: { certificateId } });
  if (!certificate || certificate.status === 'REVOKED') {
    return null;
  }
  return readFile('certificates', certificate.pdfPath);
}
