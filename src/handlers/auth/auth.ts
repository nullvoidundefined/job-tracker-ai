import * as authRepo from 'app/repositories/auth/auth.js';
import { loginSchema, registerSchema } from 'app/schemas/auth.js';
import { ApiError } from 'app/utils/ApiError.js';
import { logger } from 'app/utils/logs/logger.js';
import type { Request, Response } from 'express';

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) =>
    req.session.regenerate((err) => (err ? reject(err) : resolve())),
  );
}
function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) =>
    req.session.destroy((err) => (err ? reject(err) : resolve())),
  );
}

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join('; ');
    throw ApiError.badRequest(message, parsed.error.issues);
  }
  const { email, password } = parsed.data;
  try {
    const user = await authRepo.createUser(email, password);
    logger.info(
      { event: 'register_success', userId: user.id, ip: req.ip },
      'User registered',
    );
    await regenerateSession(req);
    req.session.userId = user.id;
    res.status(201).json({
      user: { id: user.id, email: user.email, created_at: user.created_at },
    });
  } catch (err) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? (err as { code: string }).code
        : undefined;
    if (code === '23505') {
      logger.warn(
        { event: 'register_duplicate_email', ip: req.ip },
        'Registration failed: email already registered',
      );
      throw new ApiError(409, 'CONFLICT', 'Email already registered');
    }
    throw err;
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join('; ');
    throw ApiError.badRequest(message, parsed.error.issues);
  }
  const { email, password } = parsed.data;
  const user = await authRepo.findUserByEmail(email);
  if (!user) {
    logger.warn(
      { event: 'login_failure', reason: 'user_not_found', ip: req.ip },
      'Login failed: user not found',
    );
    throw ApiError.unauthorized('Invalid email or password');
  }
  const valid = await authRepo.verifyPassword(password, user.password_hash);
  if (!valid) {
    logger.warn(
      {
        event: 'login_failure',
        reason: 'wrong_password',
        userId: user.id,
        ip: req.ip,
      },
      'Login failed: wrong password',
    );
    throw ApiError.unauthorized('Invalid email or password');
  }
  logger.info(
    { event: 'login_success', userId: user.id, ip: req.ip },
    'User logged in',
  );
  await regenerateSession(req);
  req.session.userId = user.id;
  res.json({
    user: { id: user.id, email: user.email, created_at: user.created_at },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  try {
    await destroySession(req);
  } catch (err) {
    logger.error({ err }, 'Failed to destroy session on logout');
  }
  logger.info({ event: 'logout', userId, ip: req.ip }, 'User logged out');
  res.status(204).send();
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user });
}
