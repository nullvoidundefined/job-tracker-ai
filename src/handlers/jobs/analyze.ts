import { analyzeAndSaveJob } from 'app/services/analyzer.service.js';
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
    res.status(400).json({ error: { message } });
    return;
  }

  try {
    const job = await analyzeAndSaveJob(
      parsed.data.raw_description,
      req.user!.id,
    );
    res.status(201).json({ data: job });
  } catch (err) {
    logger.error({ err }, 'Job analysis failed');
    res
      .status(502)
      .json({ error: { message: 'AI analysis failed. Please try again.' } });
  }
}
