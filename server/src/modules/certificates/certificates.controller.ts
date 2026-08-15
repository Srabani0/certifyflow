import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../errors/AppError';
import { batchGenerateSchema, downloadZipSchema, testCertificateSchema } from './certificates.schema';
import {
  batchGenerateCertificates,
  generateTestCertificate,
  getCertificatePdfBuffer,
  listCertificates,
  revokeCertificate,
  streamCertificatesZip,
} from './certificates.service';

function requireOrganizationId(req: Request): string {
  if (!req.organizationId) {
    throw AppError.unauthorized();
  }
  return req.organizationId;
}

export const test = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganizationId(req);
  const input = testCertificateSchema.parse(req.body);
  const pdf = await generateTestCertificate(organizationId, req.params.eventId, input.certificateTypeId, input.participantId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="test-certificate.pdf"');
  res.send(pdf);
});

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganizationId(req);
  const input = batchGenerateSchema.parse(req.body);
  const result = await batchGenerateCertificates(organizationId, req.params.eventId, input.participantIds);
  res.status(200).json(result);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganizationId(req);
  const certificates = await listCertificates(organizationId, req.params.eventId);
  res.status(200).json({ certificates });
});

export const download = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganizationId(req);
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
  const organizationId = requireOrganizationId(req);
  const certificate = await revokeCertificate(organizationId, req.params.eventId, req.params.certificateRecordId);
  res.status(200).json({ certificate });
});

export const downloadZip = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganizationId(req);
  const input = downloadZipSchema.parse(req.body);
  await streamCertificatesZip(organizationId, req.params.eventId, input.certificateIds, res);
});
