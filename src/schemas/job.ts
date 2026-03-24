import { z } from "zod";

const JOB_STATUSES = ["applied", "interviewing", "offer", "rejected", "saved"] as const;

export const jobSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  requirements: z.array(z.string()),
  tech_stack: z.array(z.string()),
  salary_range: z.string().nullable(),
  fit_score: z.number().int().nullable(),
  fit_explanation: z.string().nullable(),
  status: z.enum(JOB_STATUSES),
  raw_description: z.string().nullable(),
  source: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
});

export const createJobSchema = z.object({
  title: z.string().max(255).optional(),
  company: z.string().max(255).optional(),
  location: z.string().max(255).optional(),
  requirements: z.array(z.string()).optional(),
  tech_stack: z.array(z.string()).optional(),
  salary_range: z.string().max(100).optional(),
  status: z.enum(JOB_STATUSES).optional(),
  raw_description: z.string().optional(),
  source: z.string().max(255).optional(),
});

export const updateJobSchema = createJobSchema;

/** Extended update schema that includes AI-generated fields (used internally by analyzer). */
export const internalUpdateJobSchema = createJobSchema.extend({
  fit_score: z.number().int().min(0).max(100).optional(),
  fit_explanation: z.string().optional(),
});

export type Job = z.infer<typeof jobSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type InternalUpdateJobInput = z.infer<typeof internalUpdateJobSchema>;
