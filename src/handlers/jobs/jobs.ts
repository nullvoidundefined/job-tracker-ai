import type { Request, Response } from "express";

import * as jobsRepo from "app/repositories/jobs/jobs.js";
import { createJobSchema, updateJobSchema } from "app/schemas/job.js";
import { parseIdParam } from "app/utils/parsers/parseIdParam.js";
import { parsePagination } from "app/utils/parsers/parsePagination.js";

export async function listJobs(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { limit, offset } = parsePagination(req.query.limit, req.query.offset);
  const { jobs, total } = await jobsRepo.listJobs(userId, limit, offset);
  res.json({ data: jobs, meta: { total, limit, offset } });
}

export async function getJob(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id);
  if (!id) {
    res.status(400).json({ error: { message: "Invalid job ID" } });
    return;
  }
  const job = await jobsRepo.getJobById(id, req.user!.id);
  if (!job) {
    res.status(404).json({ error: { message: "Job not found" } });
    return;
  }
  res.json({ data: job });
}

export async function createJob(req: Request, res: Response): Promise<void> {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join("; ");
    res.status(400).json({ error: { message } });
    return;
  }
  const job = await jobsRepo.createJob(req.user!.id, parsed.data);
  res.status(201).json({ data: job });
}

export async function updateJob(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id);
  if (!id) {
    res.status(400).json({ error: { message: "Invalid job ID" } });
    return;
  }
  const parsed = updateJobSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join("; ");
    res.status(400).json({ error: { message } });
    return;
  }
  const job = await jobsRepo.updateJob(id, req.user!.id, parsed.data);
  if (!job) {
    res.status(404).json({ error: { message: "Job not found" } });
    return;
  }
  res.json({ data: job });
}

export async function deleteJob(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id);
  if (!id) {
    res.status(400).json({ error: { message: "Invalid job ID" } });
    return;
  }
  const deleted = await jobsRepo.deleteJob(id, req.user!.id);
  if (!deleted) {
    res.status(404).json({ error: { message: "Job not found" } });
    return;
  }
  res.status(204).send();
}
