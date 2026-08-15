import { z } from 'zod';

export const addParticipantSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(160),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').optional().or(z.literal('')),
  certificateTypeId: z.string().optional().or(z.literal('')),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateParticipantSchema = addParticipantSchema.partial();

export const bulkAssignCertificateTypeSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1, 'Select at least one participant'),
  certificateTypeId: z.string().min(1, 'A certificate type is required'),
});

export const csvMappingSchema = z.object({
  nameColumn: z.string().min(1, 'Select which column holds the participant name'),
  emailColumn: z.string().optional(),
  categoryColumn: z.string().optional(),
});

export const confirmImportSchema = z.object({
  rows: z.array(z.record(z.string(), z.string())).min(1, 'No rows to import'),
  mapping: csvMappingSchema,
});

export const listParticipantsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  certificateTypeId: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'name']).default('newest'),
});

export type AddParticipantInput = z.infer<typeof addParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;
export type BulkAssignCertificateTypeInput = z.infer<typeof bulkAssignCertificateTypeSchema>;
export type CsvMapping = z.infer<typeof csvMappingSchema>;
export type ConfirmImportInput = z.infer<typeof confirmImportSchema>;
export type ListParticipantsQuery = z.infer<typeof listParticipantsQuerySchema>;
