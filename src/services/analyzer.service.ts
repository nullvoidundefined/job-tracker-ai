import crypto from "node:crypto";

import { EXTRACTION_SYSTEM_PROMPT, buildExtractionPrompt } from "app/prompts/extract-job.js";
import { FIT_SCORE_SYSTEM_PROMPT, buildFitScorePrompt } from "app/prompts/score-fit.js";
import * as jobsRepo from "app/repositories/jobs/jobs.js";
import * as profileRepo from "app/repositories/profile/profile.js";
import {
  type FitScore,
  type JobExtraction,
  fitScoreSchema,
  jobExtractionSchema,
} from "app/schemas/job-extraction.js";
import type { Job } from "app/schemas/job.js";
import { callClaude } from "app/services/anthropic.service.js";
import { logger } from "app/utils/logs/logger.js";

const MAX_RETRIES = 2;

/** In-memory cache keyed by hash of raw description. */
const analysisCache = new Map<string, JobExtraction>();

function hashDescription(text: string): string {
  return crypto.createHash("sha256").update(text.trim()).digest("hex");
}

function parseJSON(text: string): unknown {
  // Strip markdown code fences if the LLM wraps its response
  const stripped = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  return JSON.parse(stripped);
}

export async function extractJobDescription(rawDescription: string): Promise<JobExtraction> {
  const hash = hashDescription(rawDescription);
  const cached = analysisCache.get(hash);
  if (cached) {
    logger.debug({ hash }, "Returning cached extraction");
    return cached;
  }

  let lastError: string | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const prompt = buildExtractionPrompt(rawDescription, lastError);
    const responseText = await callClaude(EXTRACTION_SYSTEM_PROMPT, prompt);

    try {
      const parsed = parseJSON(responseText);
      const result = jobExtractionSchema.parse(parsed);
      analysisCache.set(hash, result);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      logger.warn({ attempt, error: lastError }, "Extraction validation failed, retrying");
    }
  }

  throw new Error(
    `Failed to extract job description after ${MAX_RETRIES + 1} attempts: ${lastError}`,
  );
}

export async function scoreFit(
  extraction: JobExtraction,
  userId: string,
): Promise<FitScore | null> {
  const profile = await profileRepo.getProfile(userId);
  if (!profile) {
    return null;
  }

  const prompt = buildFitScorePrompt(
    extraction.requirements,
    extraction.tech_stack,
    extraction.title,
    profile.skills,
    profile.experience_summary,
    profile.job_title,
    profile.years_of_experience,
  );

  let lastError: string | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const responseText = await callClaude(FIT_SCORE_SYSTEM_PROMPT, prompt);

    try {
      const parsed = parseJSON(responseText);
      return fitScoreSchema.parse(parsed);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      logger.warn({ attempt, error: lastError }, "Fit score validation failed, retrying");
    }
  }

  throw new Error(`Failed to score fit after ${MAX_RETRIES + 1} attempts: ${lastError}`);
}

export async function analyzeAndSaveJob(rawDescription: string, userId: string): Promise<Job> {
  const extraction = await extractJobDescription(rawDescription);
  const fitResult = await scoreFit(extraction, userId);

  const job = await jobsRepo.createJob(userId, {
    title: extraction.title ?? undefined,
    company: extraction.company ?? undefined,
    location: extraction.location ?? undefined,
    requirements: extraction.requirements,
    tech_stack: extraction.tech_stack,
    salary_range: extraction.salary_range ?? undefined,
    raw_description: rawDescription,
    source: "ai-analyzed",
    status: "saved",
  });

  if (fitResult) {
    const updated = await jobsRepo.updateJob(job.id, userId, {
      fit_score: fitResult.score,
      fit_explanation: fitResult.explanation,
    });
    return updated ?? job;
  }

  return job;
}
