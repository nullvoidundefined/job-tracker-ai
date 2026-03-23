import type { Request, Response, NextFunction } from "express";

import * as authRepo from "app/repositories/auth/auth.js";

export async function loadSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.session?.userId;
  if (!userId) {
    next();
    return;
  }
  try {
    const user = await authRepo.findUserById(userId);
    if (user) req.user = user;
  } catch (err) {
    next(err);
    return;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: { message: "Authentication required" } });
    return;
  }
  next();
}
