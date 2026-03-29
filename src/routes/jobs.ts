import { analyzeJob } from 'app/handlers/jobs/analyze.js';
import * as jobHandlers from 'app/handlers/jobs/jobs.js';
import { requireAuth } from 'app/middleware/requireAuth/requireAuth.js';
import { asyncHandler } from 'app/utils/asyncHandler.js';
import express from 'express';

const jobsRouter = express.Router();

jobsRouter.use(requireAuth);
jobsRouter.get('/', asyncHandler(jobHandlers.listJobs));
jobsRouter.post('/', asyncHandler(jobHandlers.createJob));
jobsRouter.post('/analyze', asyncHandler(analyzeJob));
jobsRouter.get('/:id', asyncHandler(jobHandlers.getJob));
jobsRouter.put('/:id', asyncHandler(jobHandlers.updateJob));
jobsRouter.delete('/:id', asyncHandler(jobHandlers.deleteJob));

export { jobsRouter };
