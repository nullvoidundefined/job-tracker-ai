import { query } from "app/db/pool/pool.js";
import type { Job, CreateJobInput, UpdateJobInput } from "app/schemas/job.js";

export async function listJobs(
  userId: string,
  limit: number,
  offset: number,
): Promise<{ jobs: Job[]; total: number }> {
  const [dataResult, countResult] = await Promise.all([
    query<Job>(
      `SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    ),
    query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM jobs WHERE user_id = $1`, [
      userId,
    ]),
  ]);
  return {
    jobs: dataResult.rows,
    total: parseInt(countResult.rows[0]?.count ?? "0", 10),
  };
}

export async function getJobById(id: string, userId: string): Promise<Job | null> {
  const result = await query<Job>(`SELECT * FROM jobs WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ]);
  return result.rows[0] ?? null;
}

export async function createJob(userId: string, input: CreateJobInput): Promise<Job> {
  const result = await query<Job>(
    `INSERT INTO jobs (user_id, title, company, location, requirements, tech_stack,
      salary_range, status, raw_description, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      userId,
      input.title ?? null,
      input.company ?? null,
      input.location ?? null,
      input.requirements ?? [],
      input.tech_stack ?? [],
      input.salary_range ?? null,
      input.status ?? "applied",
      input.raw_description ?? null,
      input.source ?? null,
    ],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Insert returned no row");
  return row;
}

export async function updateJob(
  id: string,
  userId: string,
  input: UpdateJobInput,
): Promise<Job | null> {
  const fields = Object.entries(input).filter(([, v]) => v !== undefined);
  if (fields.length === 0) return getJobById(id, userId);

  const setClauses = fields.map(([key], i) => `"${key}" = $${i + 3}`).join(", ");
  const values = fields.map(([, v]) => v);

  const result = await query<Job>(
    `UPDATE jobs SET ${setClauses} WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, ...values],
  );
  return result.rows[0] ?? null;
}

export async function deleteJob(id: string, userId: string): Promise<boolean> {
  const result = await query(`DELETE FROM jobs WHERE id = $1 AND user_id = $2`, [id, userId]);
  return (result.rowCount ?? 0) > 0;
}
