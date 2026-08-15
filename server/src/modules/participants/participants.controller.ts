import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../errors/AppError';
import { addParticipantSchema, bulkAssignCertificateTypeSchema, updateParticipantSchema } from './participants.schema';
import {
  addParticipant,
  bulkAssignCertificateType,
  deleteParticipant,
  getParticipant,
  importParticipantsFromCsv,
  listParticipants,
  updateParticipant,
} from './participants.service';

function requireOrganizationId(req: Request): string {
  if (!req.organizationId) {
    throw AppError.unauthorized();
  }
  return req.organizationId;
}

export const create = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganizationId(req);
  const input = addParticipantSchema.parse(req.body);
  const participant = await addParticipant(organizationId, req.params.eventId, input);
  res.status(201).json({ participant });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganizationId(req);
  const participants = await listParticipants(organizationId, req.params.eventId);
  res.status(200).json({ participants });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganizationId(req);
  const participant = await getParticipant(organizationId, req.params.eventId, req.params.participantId);
  res.status(200).json({ participant });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganizationId(req);
  const input = updateParticipantSchema.parse(req.body);
  const participant = await updateParticipant(organizationId, req.params.eventId, req.params.participantId, input);
  res.status(200).json({ participant });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganizationId(req);
  await deleteParticipant(organizationId, req.params.eventId, req.params.participantId);
  res.status(204).send();
});

export const bulkAssign = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganizationId(req);
  const input = bulkAssignCertificateTypeSchema.parse(req.body);
  const count = await bulkAssignCertificateType(
    organizationId,
    req.params.eventId,
    input.participantIds,
    input.certificateTypeId,
  );
  res.status(200).json({ updated: count });
});

export const importCsv = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = requireOrganizationId(req);
  if (!req.file) {
    throw AppError.badRequest('No CSV file was uploaded');
  }
  const result = await importParticipantsFromCsv(organizationId, req.params.eventId, req.file.buffer);
  res.status(200).json(result);
});
