import express from "express";
import session from "express-session";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as jobHandlers from "app/handlers/jobs/jobs.js";
import { errorHandler } from "app/middleware/errorHandler/errorHandler.js";
import { requireAuth } from "app/middleware/requireAuth/requireAuth.js";
import * as jobsRepo from "app/repositories/jobs/jobs.js";
import type { Job } from "app/schemas/job.js";
import { expectError, expectListResponse } from "app/utils/tests/responseHelpers.js";
import { uuid } from "app/utils/tests/uuids.js";

vi.mock("app/repositories/jobs/jobs.js");
vi.mock("app/utils/logs/logger.js", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const userId = uuid();
const jobId = uuid();

const mockJob: Job = {
  id: jobId,
  user_id: userId,
  title: "Engineer",
  company: "Acme",
  location: "Remote",
  requirements: ["TypeScript"],
  tech_stack: ["Node.js"],
  salary_range: "$120k",
  fit_score: null,
  fit_explanation: null,
  status: "applied",
  raw_description: null,
  source: null,
  created_at: new Date("2025-01-01"),
  updated_at: null,
};

const app = express();
app.use(express.json());
app.use(session({ secret: "test-secret", resave: false, saveUninitialized: false }));

// Inject req.user for all routes (simulates a logged-in user)
app.use((req, _res, next) => {
  req.user = {
    id: userId,
    email: "user@example.com",
    created_at: new Date("2025-01-01"),
    updated_at: null,
  };
  next();
});

app.use(requireAuth);
app.get("/jobs", jobHandlers.listJobs);
app.post("/jobs", jobHandlers.createJob);
app.get("/jobs/:id", jobHandlers.getJob);
app.put("/jobs/:id", jobHandlers.updateJob);
app.delete("/jobs/:id", jobHandlers.deleteJob);
app.use(errorHandler);

describe("jobs handlers", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("GET /jobs", () => {
    it("returns 200 with jobs list and meta", async () => {
      vi.mocked(jobsRepo.listJobs).mockResolvedValueOnce({ jobs: [mockJob], total: 1 });
      const res = await request(app).get("/jobs");
      expectListResponse(res, [mockJob], 1);
      expect(jobsRepo.listJobs).toHaveBeenCalledWith(userId, 50, 0);
    });

    it("returns 200 with empty list", async () => {
      vi.mocked(jobsRepo.listJobs).mockResolvedValueOnce({ jobs: [], total: 0 });
      const res = await request(app).get("/jobs");
      expectListResponse(res, [], 0);
    });
  });

  describe("GET /jobs/:id", () => {
    it("returns 200 with job", async () => {
      vi.mocked(jobsRepo.getJobById).mockResolvedValueOnce(mockJob);
      const res = await request(app).get(`/jobs/${jobId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(jobId);
    });

    it("returns 404 when not found", async () => {
      vi.mocked(jobsRepo.getJobById).mockResolvedValueOnce(null);
      const res = await request(app).get(`/jobs/${jobId}`);
      expectError(res, 404, "Job not found");
    });

    it("returns 400 for invalid UUID", async () => {
      const res = await request(app).get("/jobs/not-a-uuid");
      expectError(res, 400, "Invalid job ID");
    });
  });

  describe("POST /jobs", () => {
    it("returns 201 with created job", async () => {
      vi.mocked(jobsRepo.createJob).mockResolvedValueOnce(mockJob);
      const res = await request(app)
        .post("/jobs")
        .send({ title: "Engineer", company: "Acme", status: "applied" });
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(jobId);
      expect(jobsRepo.createJob).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ title: "Engineer" }),
      );
    });

    it("returns 201 with empty body (all fields optional)", async () => {
      vi.mocked(jobsRepo.createJob).mockResolvedValueOnce(mockJob);
      const res = await request(app).post("/jobs").send({});
      expect(res.status).toBe(201);
    });

    it("returns 400 for invalid status", async () => {
      const res = await request(app).post("/jobs").send({ status: "unknown" });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toBeTruthy();
    });
  });

  describe("PUT /jobs/:id", () => {
    it("returns 200 with updated job", async () => {
      const updated = { ...mockJob, title: "Senior Engineer" };
      vi.mocked(jobsRepo.updateJob).mockResolvedValueOnce(updated);
      const res = await request(app).put(`/jobs/${jobId}`).send({ title: "Senior Engineer" });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Senior Engineer");
    });

    it("returns 404 when not found", async () => {
      vi.mocked(jobsRepo.updateJob).mockResolvedValueOnce(null);
      const res = await request(app).put(`/jobs/${jobId}`).send({ title: "X" });
      expectError(res, 404, "Job not found");
    });

    it("returns 400 for invalid UUID", async () => {
      const res = await request(app).put("/jobs/not-a-uuid").send({ title: "X" });
      expectError(res, 400, "Invalid job ID");
    });
  });

  describe("DELETE /jobs/:id", () => {
    it("returns 204 when deleted", async () => {
      vi.mocked(jobsRepo.deleteJob).mockResolvedValueOnce(true);
      const res = await request(app).delete(`/jobs/${jobId}`);
      expect(res.status).toBe(204);
    });

    it("returns 404 when not found", async () => {
      vi.mocked(jobsRepo.deleteJob).mockResolvedValueOnce(false);
      const res = await request(app).delete(`/jobs/${jobId}`);
      expectError(res, 404, "Job not found");
    });

    it("returns 400 for invalid UUID", async () => {
      const res = await request(app).delete("/jobs/not-a-uuid");
      expectError(res, 400, "Invalid job ID");
    });
  });
});
