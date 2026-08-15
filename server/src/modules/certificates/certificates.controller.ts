import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
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
  listCertificates,
  revokeCertificate,
  streamCertificatesZip,
} from './certificates.service';

export const test = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const input = testCertificateSchema.parse(req.body);
  const pdf = await generateTestCertificate(organizationId, req.params.eventId, input.certificateTypeId, input.participantId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="test-certificate.pdf"');
  res.send(pdf);
});

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const input = batchGenerateSchema.parse(req.body);
  const result = await batchGenerateCertificates(organizationId, req.params.eventId, input.participantIds);
  res.status(200).json(result);
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
  const { organizationId } = requireAuthContext(req);
  const certificate = await revokeCertificate(organizationId, req.params.eventId, req.params.certificateRecordId);
  res.status(200).json({ certificate });
});

export const downloadZip = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const input = downloadZipSchema.parse(req.body);
  await streamCertificatesZip(organizationId, req.params.eventId, input.certificateIds, res);
});
