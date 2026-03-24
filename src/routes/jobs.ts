import express from "express";

import { analyzeJob } from "app/handlers/jobs/analyze.js";
import * as jobHandlers from "app/handlers/jobs/jobs.js";
import { requireAuth } from "app/middleware/requireAuth/requireAuth.js";

const jobsRouter = express.Router();

jobsRouter.use(requireAuth);
jobsRouter.get("/", jobHandlers.listJobs);
jobsRouter.post("/", jobHandlers.createJob);
jobsRouter.post("/analyze", analyzeJob);
jobsRouter.get("/:id", jobHandlers.getJob);
jobsRouter.put("/:id", jobHandlers.updateJob);
jobsRouter.delete("/:id", jobHandlers.deleteJob);

export { jobsRouter };
