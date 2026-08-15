import { z } from 'zod';

export const testCertificateSchema = z.object({
  certificateTypeId: z.string().min(1, 'A certificate type is required'),
  participantId: z.string().optional(),
});

export const batchGenerateSchema = z.object({
  participantIds: z.array(z.string().min(1)).optional(),
});

export const downloadZipSchema = z.object({
  certificateIds: z.array(z.string().min(1)).optional(),
});

export type TestCertificateInput = z.infer<typeof testCertificateSchema>;
export type BatchGenerateInput = z.infer<typeof batchGenerateSchema>;
export type DownloadZipInput = z.infer<typeof downloadZipSchema>;
