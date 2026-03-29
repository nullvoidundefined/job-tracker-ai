import {
  loadSession,
  requireAuth,
} from 'app/middleware/requireAuth/requireAuth.js';
import * as authRepo from 'app/repositories/auth/auth.js';
import { uuid } from 'app/utils/tests/uuids.js';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('app/repositories/auth/auth.js');

const id = uuid();
const app = express();
app.use(express.json());

// Inject req.session.userId via a test header so loadSession can be exercised
// without mounting the full express-session stack.
app.use((req, _res, next) => {
  const testUserId = req.headers['x-test-user-id'];
  if (testUserId && typeof testUserId === 'string') {
    req.session = { userId: testUserId } as typeof req.session;
  }
  next();
});

app.use(loadSession);
app.get('/protected', requireAuth, (req, res) => res.json({ user: req.user }));

describe('requireAuth', () => {
  it('returns 401 when req.user is not set', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication required');
  });
});

describe('loadSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls next without setting req.user when no session userId', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(authRepo.findUserById).not.toHaveBeenCalled();
  });

  it('sets req.user when session userId resolves to a user', async () => {
    const user = {
      id,
      email: 'u@example.com',
      created_at: new Date('2025-01-01'),
      updated_at: null,
    };
    vi.mocked(authRepo.findUserById).mockResolvedValueOnce(user);

    const res = await request(app).get('/protected').set('x-test-user-id', id);

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      id,
      email: 'u@example.com',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: null,
    });
    expect(authRepo.findUserById).toHaveBeenCalledWith(id);
  });

  it('does not set req.user when findUserById returns null', async () => {
    vi.mocked(authRepo.findUserById).mockResolvedValueOnce(null);

    const res = await request(app).get('/protected').set('x-test-user-id', id);

    expect(res.status).toBe(401);
    expect(authRepo.findUserById).toHaveBeenCalledWith(id);
  });

  it('calls next(err) when findUserById throws', async () => {
    const dbError = new Error('connection refused');
    vi.mocked(authRepo.findUserById).mockRejectedValueOnce(dbError);

    const res = await request(app).get('/protected').set('x-test-user-id', id);

    expect(res.status).toBe(500);
    expect(authRepo.findUserById).toHaveBeenCalledWith(id);
  });
});
