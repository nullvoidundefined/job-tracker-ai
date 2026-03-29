import { analyzeJob } from 'app/handlers/jobs/analyze.js';
import { errorHandler } from 'app/middleware/errorHandler/errorHandler.js';
import { requireAuth } from 'app/middleware/requireAuth/requireAuth.js';
import type { Job } from 'app/schemas/job.js';
import * as analyzerService from 'app/services/analyzer.service.js';
import { asyncHandler } from 'app/utils/asyncHandler.js';
import { uuid } from 'app/utils/tests/uuids.js';
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('app/services/analyzer.service.js');
vi.mock('app/utils/logs/logger.js', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const userId = uuid();
const jobId = uuid();

const mockJob: Job = {
  id: jobId,
  user_id: userId,
  title: 'Senior Engineer',
  company: 'TechCorp',
  location: 'Remote',
  requirements: ['TypeScript'],
  tech_stack: ['Node.js'],
  salary_range: '$150k-$200k',
  fit_score: 85,
  fit_explanation: 'Strong match',
  status: 'saved',
  raw_description: 'We are hiring a Senior Engineer at TechCorp...',
  source: 'ai-analyzed',
  created_at: new Date('2025-01-01'),
  updated_at: null,
};

const app = express();
app.use(express.json());
app.use(
  session({ secret: 'test-secret', resave: false, saveUninitialized: false }),
);
app.use((req, _res, next) => {
  req.user = {
    id: userId,
    email: 'user@example.com',
    created_at: new Date('2025-01-01'),
    updated_at: null,
  };
  next();
});
app.use(requireAuth);
app.post('/jobs/analyze', asyncHandler(analyzeJob));
app.use(errorHandler);

describe('POST /jobs/analyze', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 201 with analyzed job', async () => {
    vi.mocked(analyzerService.analyzeAndSaveJob).mockResolvedValueOnce(mockJob);
    const res = await request(app).post('/jobs/analyze').send({
      raw_description:
        'We are hiring a Senior Engineer at TechCorp in Remote. Requirements: TypeScript. Salary: $150k-$200k.',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Senior Engineer');
    expect(res.body.data.fit_score).toBe(85);
  });

  it('returns 400 when raw_description is missing', async () => {
    const res = await request(app).post('/jobs/analyze').send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBeTruthy();
  });

  it('returns 400 when raw_description is too short', async () => {
    const res = await request(app)
      .post('/jobs/analyze')
      .send({ raw_description: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('at least 20 characters');
  });

  it('returns 502 when AI analysis fails', async () => {
    vi.mocked(analyzerService.analyzeAndSaveJob).mockRejectedValueOnce(
      new Error('API error'),
    );
    const res = await request(app).post('/jobs/analyze').send({
      raw_description:
        'A long enough job description for testing purposes here',
    });
    expect(res.status).toBe(502);
    expect(res.body.message).toBe('AI analysis failed. Please try again.');
  });
});
