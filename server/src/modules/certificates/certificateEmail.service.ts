import type { Certificate, CertificateEmailStatus } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { getMessageEvents, sendTransactionalEmail } from '../../lib/brevo';
import { escapeHtml } from '../../lib/templateEngine';
import { prisma } from '../../lib/prisma';
import { readFile } from '../../lib/storage';
import { getOwnedEventOrThrow } from '../events/events.service';
import { buildVerifyUrl } from './pdf.service';

type CertificateWithRelations = Certificate & {
  participant: { fullName: string; email: string | null };
  event: { name: string };
  organization: { name: string };
};

async function loadCertificateForEmail(
  organizationId: string,
  eventId: string,
  certificateRecordId: string,
): Promise<CertificateWithRelations> {
  await getOwnedEventOrThrow(organizationId, eventId);

  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateRecordId },
    include: {
      participant: { select: { fullName: true, email: true } },
      event: { select: { name: true } },
      organization: { select: { name: true } },
    },
  });
  if (!certificate || certificate.eventId !== eventId) {
    throw AppError.notFound('Certificate not found');
  }
  return certificate;
}

function buildEmailHtml(params: {
  participantName: string;
  eventName: string;
  organizationName: string;
  verifyUrl: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
      <p>Hi ${escapeHtml(params.participantName)},</p>
      <p>Your certificate for <strong>${escapeHtml(params.eventName)}</strong> from
      ${escapeHtml(params.organizationName)} is attached to this email.</p>
      <p>You can verify it anytime at:<br />
      <a href="${params.verifyUrl}">${escapeHtml(params.verifyUrl)}</a></p>
    </div>
  `.trim();
}

async function deliverCertificateEmail(certificate: CertificateWithRelations): Promise<Certificate> {
  if (!certificate.participant.email) {
    throw AppError.badRequest('This participant has no email address on file');
  }

  const verifyUrl = buildVerifyUrl(certificate.certificateId);
  const pdfBuffer = await readFile('certificates', certificate.pdfPath);

  try {
    const { messageId } = await sendTransactionalEmail({
      to: { email: certificate.participant.email, name: certificate.participant.fullName },
      subject: `Your certificate for ${certificate.event.name}`,
      htmlContent: buildEmailHtml({
        participantName: certificate.participant.fullName,
        eventName: certificate.event.name,
        organizationName: certificate.organization.name,
        verifyUrl,
      }),
      attachment: [{ name: `${certificate.certificateId}.pdf`, content: pdfBuffer.toString('base64') }],
    });

    return await prisma.certificate.update({
      where: { id: certificate.id },
      data: { emailStatus: 'SENT', emailSentAt: new Date(), emailMessageId: messageId, emailError: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await prisma.certificate.update({
      where: { id: certificate.id },
      data: { emailStatus: 'FAILED', emailError: message },
    });
    throw error;
  }
}

export async function sendCertificateEmail(
  organizationId: string,
  eventId: string,
  certificateRecordId: string,
): Promise<Certificate> {
  const certificate = await loadCertificateForEmail(organizationId, eventId, certificateRecordId);
  return deliverCertificateEmail(certificate);
}

export interface BulkEmailResult {
  requested: number;
  sent: number;
  failed: { certificateId: string; reason: string }[];
}

export async function bulkSendCertificateEmails(
  organizationId: string,
  eventId: string,
  certificateIds: string[] | undefined,
): Promise<BulkEmailResult> {
  await getOwnedEventOrThrow(organizationId, eventId);

  const certificates = await prisma.certificate.findMany({
    where: {
      eventId,
      status: 'GENERATED',
      ...(certificateIds ? { id: { in: certificateIds } } : {}),
    },
    include: {
      participant: { select: { fullName: true, email: true } },
      event: { select: { name: true } },
      organization: { select: { name: true } },
    },
  });

  let sent = 0;
  const failed: { certificateId: string; reason: string }[] = [];

  for (const certificate of certificates) {
    if (!certificate.participant.email) {
      failed.push({ certificateId: certificate.certificateId, reason: 'No email address on file' });
      continue;
    }
    try {
      // Sequential on purpose, same rationale as batch PDF generation: avoid hammering the email API.
      // eslint-disable-next-line no-await-in-loop
      await deliverCertificateEmail(certificate);
      sent += 1;
    } catch (error) {
      failed.push({
        certificateId: certificate.certificateId,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { requested: certificates.length, sent, failed };
}

const EVENT_PRIORITY: Record<string, number> = {
  click: 4,
  clicks: 4,
  opened: 3,
  hardBounces: 2,
  softBounces: 2,
  blocked: 2,
  invalid: 2,
  spam: 2,
  delivered: 1,
  requests: 1,
};

const EVENT_TO_STATUS: Record<string, CertificateEmailStatus> = {
  click: 'CLICKED',
  clicks: 'CLICKED',
  opened: 'OPENED',
  hardBounces: 'BOUNCED',
  softBounces: 'BOUNCED',
  blocked: 'BOUNCED',
  invalid: 'BOUNCED',
  spam: 'BOUNCED',
  delivered: 'SENT',
  requests: 'SENT',
};

export async function refreshEmailTracking(
  organizationId: string,
  eventId: string,
  certificateRecordId: string,
): Promise<Certificate> {
  const certificate = await loadCertificateForEmail(organizationId, eventId, certificateRecordId);
  if (!certificate.emailMessageId) {
    throw AppError.badRequest('This certificate has not been emailed yet');
  }

  const events = await getMessageEvents(certificate.emailMessageId);
  const best = events.reduce<{ priority: number; status: CertificateEmailStatus } | null>((acc, event) => {
    const priority = EVENT_PRIORITY[event.event];
    const status = EVENT_TO_STATUS[event.event];
    if (priority === undefined || status === undefined) {
      return acc;
    }
    if (!acc || priority > acc.priority) {
      return { priority, status };
    }
    return acc;
  }, null);

  if (!best) {
    return certificate;
  }

  return prisma.certificate.update({
    where: { id: certificate.id },
    data: { emailStatus: best.status },
  });
}
