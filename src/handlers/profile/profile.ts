import type { Request, Response } from "express";

import * as profileRepo from "app/repositories/profile/profile.js";
import { updateProfileSchema } from "app/schemas/profile.js";

export async function getProfile(req: Request, res: Response): Promise<void> {
  const profile = await profileRepo.getProfile(req.user!.id);
  if (!profile) {
    res.status(404).json({ error: { message: "Profile not found" } });
    return;
  }
  res.json({ data: profile });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join("; ");
    res.status(400).json({ error: { message } });
    return;
  }
  const profile = await profileRepo.upsertProfile(req.user!.id, parsed.data);
  res.json({ data: profile });
}
