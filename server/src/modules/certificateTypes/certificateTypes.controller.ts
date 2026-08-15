import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuthContext } from '../../lib/authContext';
import { createCertificateTypeSchema, updateCertificateTypeSchema } from './certificateTypes.schema';
import {
  createCertificateType,
  deleteCertificateType,
  getCertificateType,
  listCertificateTypes,
  updateCertificateType,
} from './certificateTypes.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const input = createCertificateTypeSchema.parse(req.body);
  const certificateType = await createCertificateType(organizationId, req.params.eventId, input);
  res.status(201).json({ certificateType });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const certificateTypes = await listCertificateTypes(organizationId, req.params.eventId);
  res.status(200).json({ certificateTypes });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const certificateType = await getCertificateType(organizationId, req.params.eventId, req.params.certificateTypeId);
  res.status(200).json({ certificateType });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const input = updateCertificateTypeSchema.parse(req.body);
  const certificateType = await updateCertificateType(
    organizationId,
    req.params.eventId,
    req.params.certificateTypeId,
    input,
  );
  res.status(200).json({ certificateType });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  await deleteCertificateType(organizationId, req.params.eventId, req.params.certificateTypeId);
  res.status(204).send();
});
