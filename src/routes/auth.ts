import * as authHandlers from 'app/handlers/auth/auth.js';
import { authRateLimiter } from 'app/middleware/rateLimiter/rateLimiter.js';
import { requireAuth } from 'app/middleware/requireAuth/requireAuth.js';
import { asyncHandler } from 'app/utils/asyncHandler.js';
import express from 'express';

const authRouter = express.Router();

authRouter.post(
  '/register',
  authRateLimiter,
  asyncHandler(authHandlers.register),
);
authRouter.post('/login', authRateLimiter, asyncHandler(authHandlers.login));
authRouter.post('/logout', asyncHandler(authHandlers.logout));
authRouter.get('/me', requireAuth, asyncHandler(authHandlers.me));

export { authRouter };
