import * as jobsRepo from 'app/repositories/jobs/jobs.js';
import { createJobSchema, updateJobSchema } from 'app/schemas/job.js';
import { ApiError } from 'app/utils/ApiError.js';
import { parseIdParam } from 'app/utils/parsers/parseIdParam.js';
import { parsePagination } from 'app/utils/parsers/parsePagination.js';
import type { Request, Response } from 'express';

export async function listJobs(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { limit, offset } = parsePagination(req.query.limit, req.query.offset);
  const { jobs, total } = await jobsRepo.listJobs(userId, limit, offset);
  res.json({ data: jobs, meta: { total, limit, offset } });
}

export async function getJob(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id);
  if (!id) {
    throw ApiError.badRequest('Invalid job ID');
  }
  const job = await jobsRepo.getJobById(id, req.user!.id);
  if (!job) {
    throw ApiError.notFound('Job not found');
  }
  res.json({ data: job });
}

export async function createJob(req: Request, res: Response): Promise<void> {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join('; ');
    throw ApiError.badRequest(message, parsed.error.issues);
  }
  const job = await jobsRepo.createJob(req.user!.id, parsed.data);
  res.status(201).json({ data: job });
}

export async function updateJob(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id);
  if (!id) {
    throw ApiError.badRequest('Invalid job ID');
  }
  const parsed = updateJobSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join('; ');
    throw ApiError.badRequest(message, parsed.error.issues);
  }
  const job = await jobsRepo.updateJob(id, req.user!.id, parsed.data);
  if (!job) {
    throw ApiError.notFound('Job not found');
  }
  res.json({ data: job });
}

export async function deleteJob(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id);
  if (!id) {
    throw ApiError.badRequest('Invalid job ID');
  }
  const deleted = await jobsRepo.deleteJob(id, req.user!.id);
  if (!deleted) {
    throw ApiError.notFound('Job not found');
  }
  res.status(204).send();
}
