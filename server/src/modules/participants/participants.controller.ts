import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../errors/AppError';
import { requireAuthContext } from '../../lib/authContext';
import {
  addParticipantSchema,
  bulkAssignCertificateTypeSchema,
  confirmImportSchema,
  listParticipantsQuerySchema,
  updateParticipantSchema,
} from './participants.schema';
import {
  addParticipant,
  bulkAssignCertificateType,
  confirmCsvImport,
  deleteParticipant,
  exportParticipantsCsv,
  getParticipant,
  listParticipants,
  previewCsvImport,
  updateParticipant,
} from './participants.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const input = addParticipantSchema.parse(req.body);
  const participant = await addParticipant(organizationId, req.params.eventId, input);
  res.status(201).json({ participant });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const query = listParticipantsQuerySchema.parse(req.query);
  const participants = await listParticipants(organizationId, req.params.eventId, query);
  res.status(200).json({ participants });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const participant = await getParticipant(organizationId, req.params.eventId, req.params.participantId);
  res.status(200).json({ participant });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const input = updateParticipantSchema.parse(req.body);
  const participant = await updateParticipant(organizationId, req.params.eventId, req.params.participantId, input);
  res.status(200).json({ participant });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  await deleteParticipant(organizationId, req.params.eventId, req.params.participantId);
  res.status(204).send();
});

export const bulkAssign = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const input = bulkAssignCertificateTypeSchema.parse(req.body);
  const count = await bulkAssignCertificateType(
    organizationId,
    req.params.eventId,
    input.participantIds,
    input.certificateTypeId,
  );
  res.status(200).json({ updated: count });
});

export const previewImport = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  if (!req.file) {
    throw AppError.badRequest('No CSV file was uploaded');
  }
  const result = await previewCsvImport(organizationId, req.params.eventId, req.file.buffer);
  res.status(200).json(result);
});

export const confirmImport = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const input = confirmImportSchema.parse(req.body);
  const result = await confirmCsvImport(organizationId, req.params.eventId, input.rows, input.mapping);
  res.status(200).json(result);
});

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = requireAuthContext(req);
  const query = listParticipantsQuerySchema.parse(req.query);
  const csv = await exportParticipantsCsv(organizationId, req.params.eventId, query);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="participants.csv"');
  res.send(csv);
});
