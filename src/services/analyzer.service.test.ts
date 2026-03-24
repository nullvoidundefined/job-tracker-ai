import { beforeEach, describe, expect, it, vi } from "vitest";

import * as jobsRepo from "app/repositories/jobs/jobs.js";
import * as profileRepo from "app/repositories/profile/profile.js";
import type { Job } from "app/schemas/job.js";
import type { Profile } from "app/schemas/profile.js";
import {
  analyzeAndSaveJob,
  extractJobDescription,
  scoreFit,
} from "app/services/analyzer.service.js";
import * as anthropicService from "app/services/anthropic.service.js";
import { uuid } from "app/utils/tests/uuids.js";

vi.mock("app/services/anthropic.service.js");
vi.mock("app/repositories/jobs/jobs.js");
vi.mock("app/repositories/profile/profile.js");
vi.mock("app/utils/logs/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const userId = uuid();
const jobId = uuid();

const validExtraction = {
  title: "Senior Engineer",
  company: "TechCorp",
  location: "Remote",
  requirements: ["5+ years experience", "TypeScript"],
  tech_stack: ["Node.js", "PostgreSQL"],
  salary_range: "$150k-$200k",
};

const validFitScore = {
  score: 85,
  explanation: "Strong match on tech stack and experience level.",
};

const mockProfile: Profile = {
  id: uuid(),
  user_id: userId,
  skills: ["TypeScript", "Node.js", "PostgreSQL"],
  experience_summary: "10 years of backend development",
  education: "BS Computer Science",
  job_title: "Senior Engineer",
  years_of_experience: 10,
  created_at: new Date("2025-01-01"),
  updated_at: null,
};

const mockJob: Job = {
  id: jobId,
  user_id: userId,
  title: "Senior Engineer",
  company: "TechCorp",
  location: "Remote",
  requirements: ["5+ years experience", "TypeScript"],
  tech_stack: ["Node.js", "PostgreSQL"],
  salary_range: "$150k-$200k",
  fit_score: null,
  fit_explanation: null,
  status: "saved",
  raw_description: "Some job description",
  source: "ai-analyzed",
  created_at: new Date("2025-01-01"),
  updated_at: null,
};

describe("analyzer service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractJobDescription", () => {
    it("extracts structured data from LLM response", async () => {
      vi.mocked(anthropicService.callClaude).mockResolvedValueOnce(JSON.stringify(validExtraction));
      // Use unique description to avoid cache
      const result = await extractJobDescription("unique-desc-" + Date.now());
      expect(result).toEqual(validExtraction);
      expect(anthropicService.callClaude).toHaveBeenCalledOnce();
    });

    it("handles markdown code fences in response", async () => {
      vi.mocked(anthropicService.callClaude).mockResolvedValueOnce(
        "```json\n" + JSON.stringify(validExtraction) + "\n```",
      );
      const result = await extractJobDescription("fenced-desc-" + Date.now());
      expect(result).toEqual(validExtraction);
    });

    it("retries on invalid LLM output and succeeds", async () => {
      vi.mocked(anthropicService.callClaude)
        .mockResolvedValueOnce("not valid json")
        .mockResolvedValueOnce(JSON.stringify(validExtraction));
      const result = await extractJobDescription("retry-desc-" + Date.now());
      expect(result).toEqual(validExtraction);
      expect(anthropicService.callClaude).toHaveBeenCalledTimes(2);
    });

    it("throws after max retries exhausted", async () => {
      vi.mocked(anthropicService.callClaude)
        .mockResolvedValueOnce("bad")
        .mockResolvedValueOnce("bad")
        .mockResolvedValueOnce("bad");
      await expect(extractJobDescription("fail-desc-" + Date.now())).rejects.toThrow(
        "Failed to extract job description after 3 attempts",
      );
    });
  });

  describe("scoreFit", () => {
    it("returns null if no profile exists", async () => {
      vi.mocked(profileRepo.getProfile).mockResolvedValueOnce(null);
      const result = await scoreFit(validExtraction, userId);
      expect(result).toBeNull();
    });

    it("returns fit score when profile exists", async () => {
      vi.mocked(profileRepo.getProfile).mockResolvedValueOnce(mockProfile);
      vi.mocked(anthropicService.callClaude).mockResolvedValueOnce(JSON.stringify(validFitScore));
      const result = await scoreFit(validExtraction, userId);
      expect(result).toEqual(validFitScore);
    });

    it("retries on invalid fit score response", async () => {
      vi.mocked(profileRepo.getProfile).mockResolvedValueOnce(mockProfile);
      vi.mocked(anthropicService.callClaude)
        .mockResolvedValueOnce('{"score": "not a number"}')
        .mockResolvedValueOnce(JSON.stringify(validFitScore));
      const result = await scoreFit(validExtraction, userId);
      expect(result).toEqual(validFitScore);
    });
  });

  describe("analyzeAndSaveJob", () => {
    it("extracts, scores, creates job, and updates with fit score", async () => {
      vi.mocked(anthropicService.callClaude)
        .mockResolvedValueOnce(JSON.stringify(validExtraction))
        .mockResolvedValueOnce(JSON.stringify(validFitScore));
      vi.mocked(profileRepo.getProfile).mockResolvedValueOnce(mockProfile);
      vi.mocked(jobsRepo.createJob).mockResolvedValueOnce(mockJob);
      const updatedJob = { ...mockJob, fit_score: 85, fit_explanation: validFitScore.explanation };
      vi.mocked(jobsRepo.updateJob).mockResolvedValueOnce(updatedJob);

      const result = await analyzeAndSaveJob("analyze-desc-" + Date.now(), userId);
      expect(result.fit_score).toBe(85);
      expect(jobsRepo.createJob).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ source: "ai-analyzed", status: "saved" }),
      );
      expect(jobsRepo.updateJob).toHaveBeenCalledWith(
        jobId,
        userId,
        expect.objectContaining({ fit_score: 85 }),
      );
    });

    it("creates job without fit score when no profile", async () => {
      vi.mocked(anthropicService.callClaude).mockResolvedValueOnce(JSON.stringify(validExtraction));
      vi.mocked(profileRepo.getProfile).mockResolvedValueOnce(null);
      vi.mocked(jobsRepo.createJob).mockResolvedValueOnce(mockJob);

      const result = await analyzeAndSaveJob("no-profile-desc-" + Date.now(), userId);
      expect(result).toEqual(mockJob);
      expect(jobsRepo.updateJob).not.toHaveBeenCalled();
    });
  });
});
