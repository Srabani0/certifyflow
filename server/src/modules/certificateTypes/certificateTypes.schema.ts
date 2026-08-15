import { z } from 'zod';

export const signatorySchema = z.object({
  name: z.string().trim().min(1, 'Signatory name is required').max(120),
  designation: z.string().trim().min(1, 'Signatory designation is required').max(120),
  signatureImageUrl: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')),
});

export const createCertificateTypeSchema = z.object({
  certificateTemplateId: z.string().min(1, 'A certificate template is required'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(160),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  signatories: z.array(signatorySchema).max(5).default([]),
});

export const updateCertificateTypeSchema = createCertificateTypeSchema.partial();

export type CreateCertificateTypeInput = z.infer<typeof createCertificateTypeSchema>;
export type UpdateCertificateTypeInput = z.infer<typeof updateCertificateTypeSchema>;
