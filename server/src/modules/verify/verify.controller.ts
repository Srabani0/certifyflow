import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../errors/AppError';
import { getVerifiedCertificatePdf, verifyCertificate } from './verify.service';

export const verify = asyncHandler(async (req: Request, res: Response) => {
  const result = await verifyCertificate(req.params.certificateId);
  res.status(200).json(result);
});

export const downloadVerified = asyncHandler(async (req: Request, res: Response) => {
  const pdf = await getVerifiedCertificatePdf(req.params.certificateId);
  if (!pdf) {
    throw AppError.notFound('Certificate not found or no longer valid');
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${req.params.certificateId}.pdf"`);
  res.send(pdf);
});
