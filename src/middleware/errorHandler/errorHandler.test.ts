import { errorHandler } from 'app/middleware/errorHandler/errorHandler.js';
import { ApiError } from 'app/utils/ApiError.js';
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('app/utils/logs/logger.js', () => ({
  logger: { error: vi.fn() },
}));

const app = express();
app.get('/boom', (_req: Request, _res: Response, next: NextFunction) => {
  next(new Error('kaboom'));
});
app.get('/api-error', (_req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound('Thing not found'));
});
app.get(
  '/api-error-details',
  (_req: Request, _res: Response, next: NextFunction) => {
    next(
      ApiError.badRequest('Validation failed', [
        { field: 'name', message: 'required' },
      ]),
    );
  },
);
app.use(errorHandler);

describe('errorHandler', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('returns 500 with error detail in non-production', async () => {
    process.env.NODE_ENV = 'development';
    const res = await request(app).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('INTERNAL_ERROR');
    expect(res.body.message).toContain('kaboom');
  });

  it('hides error detail in production', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(app).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('INTERNAL_ERROR');
    expect(res.body.message).toBe('Internal server error');
  });

  it('returns correct statusCode and code for ApiError', async () => {
    const res = await request(app).get('/api-error');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: 'NOT_FOUND',
      message: 'Thing not found',
    });
  });

  it('includes details when ApiError has them', async () => {
    const res = await request(app).get('/api-error-details');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.details).toEqual([{ field: 'name', message: 'required' }]);
  });
});
