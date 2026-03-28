import * as authHandlers from 'app/handlers/auth/auth.js';
import { errorHandler } from 'app/middleware/errorHandler/errorHandler.js';
import { requireAuth } from 'app/middleware/requireAuth/requireAuth.js';
import * as authRepo from 'app/repositories/auth/auth.js';
import type { User } from 'app/schemas/auth.js';
import { uuid } from 'app/utils/tests/uuids.js';
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('app/repositories/auth/auth.js');
vi.mock('app/utils/logs/logger.js', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const id = uuid();
const app = express();
app.use(express.json());
app.use(
  session({ secret: 'test-secret', resave: false, saveUninitialized: false }),
);
app.post('/register', authHandlers.register);
app.post('/login', authHandlers.login);
app.post('/logout', authHandlers.logout);
app.get(
  '/me',
  (req, res, next) => {
    if (req.headers['x-test-user'] === '1') {
      req.user = {
        id,
        email: 'user@example.com',
        created_at: new Date('2025-01-01'),
        updated_at: null,
      };
    }
    next();
  },
  requireAuth,
  authHandlers.me,
);
app.use(errorHandler);

const mockUser: User & { password_hash: string } = {
  id,
  email: 'user@example.com',
  password_hash: 'hashed',
  created_at: new Date('2025-01-01'),
  updated_at: null,
};

describe('auth handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('returns 400 when body invalid', async () => {
      const res = await request(app).post('/register').send({});
      expect(res.status).toBe(400);
      expect(authRepo.createUser).not.toHaveBeenCalled();
    });
    it('returns 201 and sets cookie when created', async () => {
      vi.mocked(authRepo.createUser).mockResolvedValueOnce(mockUser);

      const res = await request(app)
        .post('/register')
        .send({ email: 'user@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.user).toEqual({
        id,
        email: 'user@example.com',
        created_at: '2025-01-01T00:00:00.000Z',
      });
      expect(res.headers['set-cookie']).toBeDefined();
      expect(authRepo.createUser).toHaveBeenCalledWith(
        'user@example.com',
        'password123',
      );
    });
    it('returns 409 on unique violation (23505)', async () => {
      const err = Object.assign(new Error('duplicate key'), { code: '23505' });
      vi.mocked(authRepo.createUser).mockRejectedValueOnce(err);

      const res = await request(app)
        .post('/register')
        .send({ email: 'user@example.com', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toBe('Email already registered');
    });
    it('returns 500 on other errors', async () => {
      vi.mocked(authRepo.createUser).mockRejectedValueOnce(
        new Error('DB error'),
      );

      const res = await request(app)
        .post('/register')
        .send({ email: 'user@example.com', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.error.message).toBeDefined();
    });
  });

  describe('login', () => {
    it('returns 400 when body invalid', async () => {
      const res = await request(app).post('/login').send({});
      expect(res.status).toBe(400);
      expect(authRepo.findUserByEmail).not.toHaveBeenCalled();
    });
    it('returns 401 when user not found', async () => {
      vi.mocked(authRepo.findUserByEmail).mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/login')
        .send({ email: 'nobody@example.com', password: 'any' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password');
    });
    it('returns 401 when password invalid', async () => {
      vi.mocked(authRepo.findUserByEmail).mockResolvedValueOnce(mockUser);
      vi.mocked(authRepo.verifyPassword).mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/login')
        .send({ email: 'user@example.com', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid email or password');
    });
    it('returns 200 and sets cookie when valid', async () => {
      vi.mocked(authRepo.findUserByEmail).mockResolvedValueOnce(mockUser);
      vi.mocked(authRepo.verifyPassword).mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/login')
        .send({ email: 'user@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual({
        id,
        email: 'user@example.com',
        created_at: '2025-01-01T00:00:00.000Z',
      });
      expect(res.headers['set-cookie']).toBeDefined();
      expect(authRepo.verifyPassword).toHaveBeenCalled();
    });
    it('returns 500 when repo throws', async () => {
      vi.mocked(authRepo.findUserByEmail).mockRejectedValueOnce(
        new Error('DB error'),
      );

      const res = await request(app)
        .post('/login')
        .send({ email: 'user@example.com', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.error.message).toBeDefined();
    });
  });

  describe('logout', () => {
    it('returns 204', async () => {
      const res = await request(app).post('/logout');
      expect(res.status).toBe(204);
    });
  });

  describe('me', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/me');
      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Authentication required');
    });
    it('returns 200 with user when req.user set', async () => {
      const res = await request(app).get('/me').set('x-test-user', '1');
      expect(res.status).toBe(200);
      expect(res.body.user).toEqual({
        id,
        email: 'user@example.com',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: null,
      });
    });
  });
});
