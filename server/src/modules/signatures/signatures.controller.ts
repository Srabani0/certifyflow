import type { Request, Response } from 'express';
import { env } from '../../config/env';
import { AppError } from '../../errors/AppError';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuthContext } from '../../lib/authContext';
import { saveFile } from '../../lib/storage';
import { createSignatureSchema } from './signatures.schema';
import { createSignatureRow, deleteSignature, listSignatures, setSignatureImage } from './signatures.service';

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const signatures = await listSignatures(organizationId);
  res.status(200).json({ signatures });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const input = createSignatureSchema.parse(req.body);

  let signature = await createSignatureRow(organizationId, input);

  if (req.file) {
    const extension = ALLOWED_IMAGE_TYPES[req.file.mimetype];
    if (!extension) {
      throw AppError.badRequest('Signature image must be a PNG, JPEG, or WEBP image');
    }
    const relativePath = `${organizationId}/${signature.id}${extension}`;
    await saveFile('signatures', relativePath, req.file.buffer);
    const imageUrl = `${env.PUBLIC_SERVER_URL}/uploads/signatures/${relativePath}`;
    signature = await setSignatureImage(signature.id, imageUrl);
  }

  res.status(201).json({ signature });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  await deleteSignature(organizationId, req.params.signatureId);
  res.status(204).send();
});
