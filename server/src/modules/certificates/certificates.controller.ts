import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { recordAuditLog } from '../../lib/auditLog';
import { requireAuthContext } from '../../lib/authContext';
import {
  batchGenerateSchema,
  downloadZipSchema,
  listCertificatesQuerySchema,
  testCertificateSchema,
} from './certificates.schema';
import {
  batchGenerateCertificates,
  exportCertificatesCsv,
  generateTestCertificate,
  getCertificatePdfBuffer,
  listBatches,
  listCertificates,
  previewBatchGeneration,
  revokeCertificate,
  streamCertificatesZip,
} from './certificates.service';
import { bulkSendCertificateEmails, refreshEmailTracking, sendCertificateEmail } from './certificateEmail.service';

export const test = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const input = testCertificateSchema.parse(req.body);
  const pdf = await generateTestCertificate(organizationId, req.params.eventId, input.certificateTypeId, input.participantId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="test-certificate.pdf"');
  res.send(pdf);
});

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const { userId, organizationId } = requireAuthContext(req);
  const input = batchGenerateSchema.parse(req.body);
  const result = await batchGenerateCertificates(organizationId, req.params.eventId, input.participantIds);
  await recordAuditLog(
    organizationId,
    userId,
    'certificates.batch_generated',
    { type: 'event', id: req.params.eventId },
    { generated: result.generated.length, skipped: result.skipped.length },
  );
  res.status(200).json(result);
});

export const previewGenerate = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const input = batchGenerateSchema.parse(req.body);
  const result = await previewBatchGeneration(organizationId, req.params.eventId, input.participantIds);
  res.status(200).json(result);
});

export const listBatchHistory = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const batches = await listBatches(organizationId, req.params.eventId);
  res.status(200).json({ batches });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const query = listCertificatesQuerySchema.parse(req.query);
  const certificates = await listCertificates(organizationId, req.params.eventId, query);
  res.status(200).json({ certificates });
});

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const query = listCertificatesQuerySchema.parse(req.query);
  const csv = await exportCertificatesCsv(organizationId, req.params.eventId, query);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="certificates.csv"');
  res.send(csv);
});

export const download = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const { certificate, buffer } = await getCertificatePdfBuffer(
    organizationId,
    req.params.eventId,
    req.params.certificateRecordId,
  );
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${certificate.certificateId}.pdf"`);
  res.send(buffer);
});

export const revoke = asyncHandler(async (req: Request, res: Response) => {
  const { userId, organizationId } = requireAuthContext(req);
  const certificate = await revokeCertificate(organizationId, req.params.eventId, req.params.certificateRecordId);
  await recordAuditLog(organizationId, userId, 'certificate.revoked', {
    type: 'certificate',
    id: certificate.id,
  });
  res.status(200).json({ certificate });
});

export const downloadZip = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const input = downloadZipSchema.parse(req.body);
  await streamCertificatesZip(organizationId, req.params.eventId, input.certificateIds, res);
});

export const sendEmail = asyncHandler(async (req: Request, res: Response) => {
  const { userId, organizationId } = requireAuthContext(req);
  const certificate = await sendCertificateEmail(organizationId, req.params.eventId, req.params.certificateRecordId);
  await recordAuditLog(organizationId, userId, 'certificate.emailed', {
    type: 'certificate',
    id: certificate.id,
  });
  res.status(200).json({ certificate });
});

export const bulkSendEmail = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const input = downloadZipSchema.parse(req.body);
  const result = await bulkSendCertificateEmails(organizationId, req.params.eventId, input.certificateIds);
  res.status(200).json(result);
});

export const refreshEmail = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const certificate = await refreshEmailTracking(organizationId, req.params.eventId, req.params.certificateRecordId);
  res.status(200).json({ certificate });
});
