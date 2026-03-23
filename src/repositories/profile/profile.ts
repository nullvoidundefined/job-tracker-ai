import { query } from "app/db/pool/pool.js";
import type { Profile, UpdateProfileInput } from "app/schemas/profile.js";

export async function getProfile(userId: string): Promise<Profile | null> {
  const result = await query<Profile>(`SELECT * FROM resume_profiles WHERE user_id = $1`, [userId]);
  return result.rows[0] ?? null;
}

export async function upsertProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
  const fields = Object.entries(input).filter(([, v]) => v !== undefined);

  if (fields.length === 0) {
    const existing = await getProfile(userId);
    if (existing) return existing;
    const result = await query<Profile>(
      `INSERT INTO resume_profiles (user_id) VALUES ($1) RETURNING *`,
      [userId],
    );
    const row = result.rows[0];
    if (!row) throw new Error("Insert returned no row");
    return row;
  }

  const colNames = fields.map(([k]) => `"${k}"`).join(", ");
  const colPlaceholders = fields.map((_, i) => `$${i + 2}`).join(", ");
  const setClauses = fields.map(([k], i) => `"${k}" = $${i + 2}`).join(", ");
  const values = fields.map(([, v]) => v);

  const result = await query<Profile>(
    `INSERT INTO resume_profiles (user_id, ${colNames})
     VALUES ($1, ${colPlaceholders})
     ON CONFLICT (user_id) DO UPDATE SET ${setClauses}
     RETURNING *`,
    [userId, ...values],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Upsert returned no row");
  return row;
}
