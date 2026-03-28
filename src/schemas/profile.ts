import { z } from 'zod';

export const profileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  skills: z.array(z.string()),
  experience_summary: z.string().nullable(),
  education: z.string().nullable(),
  job_title: z.string().nullable(),
  years_of_experience: z.number().int().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
});

export const updateProfileSchema = z.object({
  skills: z.array(z.string()).optional(),
  experience_summary: z.string().optional(),
  education: z.string().optional(),
  job_title: z.string().max(255).optional(),
  years_of_experience: z.number().int().min(0).max(100).optional(),
});

export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
