import * as profileRepo from 'app/repositories/profile/profile.js';
import { updateProfileSchema } from 'app/schemas/profile.js';
import { ApiError } from 'app/utils/ApiError.js';
import type { Request, Response } from 'express';

export async function getProfile(req: Request, res: Response): Promise<void> {
  const profile = await profileRepo.getProfile(req.user!.id);
  if (!profile) {
    throw ApiError.notFound('Profile not found');
  }
  res.json({ data: profile });
}

export async function updateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join('; ');
    throw ApiError.badRequest(message, parsed.error.issues);
  }
  const profile = await profileRepo.upsertProfile(req.user!.id, parsed.data);
  res.json({ data: profile });
}
