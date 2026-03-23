/**
 * Single smoke test for route wiring: verifies each path/method reaches the correct handler.
 * Handler behavior is covered by handler tests; this only guards against broken router wiring.
 */
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { authRouter } from "app/routes/auth.js";
import { jobsRouter } from "app/routes/jobs.js";
import { profileRouter } from "app/routes/profile.js";
import { uuid } from "app/utils/tests/uuids.js";

vi.mock("app/handlers/auth/auth.js", () => ({
  register: (_: express.Request, res: express.Response) => res.status(201).json({ ok: true }),
  login: (_: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
  logout: (_: express.Request, res: express.Response) => res.status(204).send(),
  me: (_: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
}));
vi.mock("app/handlers/jobs/jobs.js", () => ({
  listJobs: (_: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
  createJob: (_: express.Request, res: express.Response) => res.status(201).json({ ok: true }),
  getJob: (_: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
  updateJob: (_: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
  deleteJob: (_: express.Request, res: express.Response) => res.status(204).send(),
}));
vi.mock("app/handlers/profile/profile.js", () => ({
  getProfile: (_: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
  updateProfile: (_: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
}));
vi.mock("app/middleware/rateLimiter/rateLimiter.js", () => ({
  authRateLimiter: (_: express.Request, __: express.Response, next: express.NextFunction) => next(),
}));
vi.mock("app/middleware/requireAuth/requireAuth.js", () => ({
  requireAuth: (_: express.Request, __: express.Response, next: express.NextFunction) => next(),
  loadSession: (_: express.Request, __: express.Response, next: express.NextFunction) => next(),
}));

const jobId = uuid();

const app = express();
app.use(express.json());
app.use("/auth", authRouter);
app.use("/jobs", jobsRouter);
app.use("/profile", profileRouter);

describe("route wiring", () => {
  describe("auth", () => {
    it("POST /auth/register → 201", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ email: "a@b.com", password: "x" });
      expect(res.status).toBe(201);
    });
    it("POST /auth/login → 200", async () => {
      const res = await request(app).post("/auth/login").send({ email: "a@b.com", password: "x" });
      expect(res.status).toBe(200);
    });
    it("POST /auth/logout → 204", async () => {
      const res = await request(app).post("/auth/logout");
      expect(res.status).toBe(204);
    });
    it("GET /auth/me → 200 (requireAuth mocked for wiring test)", async () => {
      const res = await request(app).get("/auth/me");
      expect(res.status).toBe(200);
    });
  });

  describe("jobs", () => {
    it("GET /jobs → 200", async () => {
      const res = await request(app).get("/jobs");
      expect(res.status).toBe(200);
    });
    it("POST /jobs → 201", async () => {
      const res = await request(app).post("/jobs").send({});
      expect(res.status).toBe(201);
    });
    it("GET /jobs/:id → 200", async () => {
      const res = await request(app).get(`/jobs/${jobId}`);
      expect(res.status).toBe(200);
    });
    it("PUT /jobs/:id → 200", async () => {
      const res = await request(app).put(`/jobs/${jobId}`).send({});
      expect(res.status).toBe(200);
    });
    it("DELETE /jobs/:id → 204", async () => {
      const res = await request(app).delete(`/jobs/${jobId}`);
      expect(res.status).toBe(204);
    });
  });

  describe("profile", () => {
    it("GET /profile → 200", async () => {
      const res = await request(app).get("/profile");
      expect(res.status).toBe(200);
    });
    it("PUT /profile → 200", async () => {
      const res = await request(app).put("/profile").send({});
      expect(res.status).toBe(200);
    });
  });
});
