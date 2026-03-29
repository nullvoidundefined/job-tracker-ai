import { analyzeAndSaveJob } from 'app/services/analyzer.service.js';
import { ApiError } from 'app/utils/ApiError.js';
import { logger } from 'app/utils/logs/logger.js';
import type { Request, Response } from 'express';
import { z } from 'zod';

const analyzeBodySchema = z.object({
  raw_description: z
    .string()
    .min(20, 'Job description must be at least 20 characters'),
});

export async function analyzeJob(req: Request, res: Response): Promise<void> {
  const parsed = analyzeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join('; ');
    throw ApiError.badRequest(message, parsed.error.issues);
  }

  try {
    const job = await analyzeAndSaveJob(
      parsed.data.raw_description,
      req.user!.id,
    );
    res.status(201).json({ data: job });
  } catch (err) {
    logger.error({ err }, 'Job analysis failed');
    throw ApiError.aiServiceError('AI analysis failed. Please try again.');
  }
}
