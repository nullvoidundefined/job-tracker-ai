import * as profileHandlers from 'app/handlers/profile/profile.js';
import * as profileRepo from 'app/repositories/profile/profile.js';
import express from 'express';
import session from 'express-session';
import supertest from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('app/repositories/profile/profile.js', () => ({
  getProfile: vi.fn(),
  upsertProfile: vi.fn(),
}));

const USER_ID = '00000000-0000-0000-0000-000000000002';

const mockProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  user_id: USER_ID,
  skills: ['TypeScript'],
  experience_summary: '5 years',
  education: null,
  job_title: 'Engineer',
  years_of_experience: 5,
  created_at: new Date(),
  updated_at: null,
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
  app.use((_req, _res, next) => {
    _req.user = {
      id: USER_ID,
      email: 'test@example.com',
      created_at: new Date(),
      updated_at: null,
    };
    next();
  });
  app.get('/profile', profileHandlers.getProfile);
  app.put('/profile', profileHandlers.updateProfile);
  return app;
}

beforeEach(() => vi.clearAllMocks());

describe('GET /profile', () => {
  it('returns 200 with profile data', async () => {
    vi.mocked(profileRepo.getProfile).mockResolvedValueOnce(mockProfile);
    const res = await supertest(buildApp()).get('/profile');
    expect(res.status).toBe(200);
    expect(res.body.data.user_id).toBe(USER_ID);
    expect(res.body.data.skills).toEqual(['TypeScript']);
  });

  it('returns 404 when profile does not exist', async () => {
    vi.mocked(profileRepo.getProfile).mockResolvedValueOnce(null);
    const res = await supertest(buildApp()).get('/profile');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Profile not found');
  });
});

describe('PUT /profile', () => {
  it('returns 200 with upserted profile on valid input', async () => {
    vi.mocked(profileRepo.upsertProfile).mockResolvedValueOnce(mockProfile);
    const res = await supertest(buildApp())
      .put('/profile')
      .send({ skills: ['TypeScript'], years_of_experience: 5 });
    expect(res.status).toBe(200);
    expect(res.body.data.skills).toEqual(['TypeScript']);
  });

  it('returns 200 on empty body (creates blank profile)', async () => {
    vi.mocked(profileRepo.upsertProfile).mockResolvedValueOnce(mockProfile);
    const res = await supertest(buildApp()).put('/profile').send({});
    expect(res.status).toBe(200);
  });

  it('returns 400 when years_of_experience is out of range', async () => {
    const res = await supertest(buildApp())
      .put('/profile')
      .send({ years_of_experience: 999 });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBeTruthy();
  });

  it('returns 400 when job_title exceeds 255 characters', async () => {
    const res = await supertest(buildApp())
      .put('/profile')
      .send({ job_title: 'a'.repeat(256) });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBeTruthy();
  });
});
