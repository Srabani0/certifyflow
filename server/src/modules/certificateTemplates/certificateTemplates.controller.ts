import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { getTemplateOrThrow, listActiveTemplates } from './certificateTemplates.service';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const templates = await listActiveTemplates();
  res.status(200).json({ templates });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const template = await getTemplateOrThrow(req.params.templateId);
  res.status(200).json({ template });
});
