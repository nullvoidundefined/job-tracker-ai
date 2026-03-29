import { isProduction } from 'app/config/env.js';
import { ApiError } from 'app/utils/ApiError.js';
import { logger } from 'app/utils/logs/logger.js';
import type { NextFunction, Request, Response } from 'express';

// Centralized error handler to ensure all uncaught errors are logged once and surfaced with a safe JSON response.
// ApiError instances carry their own statusCode/code; all other errors default to 500/INTERNAL_ERROR.
// Raw error messages are never exposed for 500s in production.

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    logger.error(
      { err, reqId: req.id, statusCode: err.statusCode, code: err.code },
      'Request error',
    );

    const body: { error: string; message: string; details?: unknown } = {
      error: err.code,
      message: err.message,
    };
    if (err.details !== undefined) {
      body.details = err.details;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  const isProd = isProduction();

  logger.error({ err, reqId: req.id }, 'Unhandled error in request handler');

  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: isProd
      ? 'Internal server error'
      : err instanceof Error
        ? (err.stack ?? err.message)
        : String(err),
  });
}
