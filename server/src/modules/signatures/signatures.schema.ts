import { z } from 'zod';

export const createSignatureSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  designation: z.string().trim().min(1, 'Designation is required').max(120),
});

export type CreateSignatureInput = z.infer<typeof createSignatureSchema>;
