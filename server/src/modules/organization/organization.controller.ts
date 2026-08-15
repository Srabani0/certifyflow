import type { Request, Response } from 'express';
import { env } from '../../config/env';
import { AppError } from '../../errors/AppError';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuthContext } from '../../lib/authContext';
import { saveFile } from '../../lib/storage';
import { getAuthContext } from '../auth/auth.service';
import { updateOrganizationSchema } from './organization.schema';
import { setOrganizationLogo, updateOrganizationProfile } from './organization.service';

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { userId, organizationId } = requireAuthContext(req);
  const input = updateOrganizationSchema.parse(req.body);
  await updateOrganizationProfile(organizationId, input);
  const result = await getAuthContext(userId, organizationId);
  res.status(200).json(result);
});

const ALLOWED_LOGO_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

export const uploadLogo = asyncHandler(async (req: Request, res: Response) => {
  const { userId, organizationId } = requireAuthContext(req);
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
  await setOrganizationLogo(organizationId, logoUrl);
  const result = await getAuthContext(userId, organizationId);
  res.status(200).json(result);
});
