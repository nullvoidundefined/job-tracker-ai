import { z } from 'zod';

export const jobExtractionSchema = z.object({
  title: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  requirements: z.array(z.string()),
  tech_stack: z.array(z.string()),
  salary_range: z.string().nullable(),
});

export type JobExtraction = z.infer<typeof jobExtractionSchema>;

export const fitScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  explanation: z.string(),
});

export type FitScore = z.infer<typeof fitScoreSchema>;
