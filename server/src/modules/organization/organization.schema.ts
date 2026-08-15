import { z } from 'zod';

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120).optional(),
  website: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')),
  brandColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Enter a hex color like #7c3aed')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  certificateIdPrefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,10}$/, 'Use 2-10 letters/numbers, no spaces or symbols')
    .optional(),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
