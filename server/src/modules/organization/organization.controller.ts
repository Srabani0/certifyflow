import type { Request, Response } from 'express';
import { env } from '../../config/env';
import { AppError } from '../../errors/AppError';
import { asyncHandler } from '../../lib/asyncHandler';
import { saveFile } from '../../lib/storage';
import { updateOrganizationSchema } from './organization.schema';
import { setOrganizationLogo, updateOrganizationProfile } from './organization.service';

function requireOrganizationId(req: Request): string {
  if (!req.organizationId) {
    throw AppError.unauthorized();
  }
  return req.organizationId;
}

export const update = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganizationId(req);
  const input = updateOrganizationSchema.parse(req.body);
  const organization = await updateOrganizationProfile(organizationId, input);
  res.status(200).json({ organization });
});

const ALLOWED_LOGO_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

export const uploadLogo = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganizationId(req);
  if (!req.file) {
    throw AppError.badRequest('No image was uploaded');
  }

  const extension = ALLOWED_LOGO_TYPES[req.file.mimetype];
  if (!extension) {
    throw AppError.badRequest('Logo must be a PNG, JPEG, or WEBP image');
  }

  const relativePath = `${organizationId}${extension}`;
  await saveFile('logos', relativePath, req.file.buffer);

  const logoUrl = `${env.PUBLIC_SERVER_URL}/uploads/logos/${relativePath}`;
  const organization = await setOrganizationLogo(organizationId, logoUrl);
  res.status(200).json({ organization });
});
