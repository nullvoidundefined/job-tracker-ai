import {
  createJobSchema,
  jobSchema,
  updateJobSchema,
} from 'app/schemas/job.js';
import { describe, expect, it } from 'vitest';

const validJob = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  user_id: '660e8400-e29b-41d4-a716-446655440001',
  title: 'Senior Engineer',
  company: 'Acme',
  location: 'Remote',
  requirements: ['5 years exp'],
  tech_stack: ['TypeScript', 'Node.js'],
  salary_range: '$120k-$150k',
  fit_score: 85,
  fit_explanation: 'Great match',
  status: 'applied' as const,
  raw_description: 'We are hiring...',
  source: 'LinkedIn',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: null,
};

describe('jobSchema', () => {
  it('accepts a valid job', () => {
    expect(jobSchema.safeParse(validJob).success).toBe(true);
  });

  it('coerces created_at to a Date', () => {
    const result = jobSchema.safeParse(validJob);
    expect(result.success).toBe(true);
    expect(result.data!.created_at).toBeInstanceOf(Date);
  });

  it('accepts null for nullable fields', () => {
    const result = jobSchema.safeParse({
      ...validJob,
      title: null,
      company: null,
      location: null,
      salary_range: null,
      fit_score: null,
      fit_explanation: null,
      raw_description: null,
      source: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid status value', () => {
    const result = jobSchema.safeParse({ ...validJob, status: 'unknown' });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer fit_score', () => {
    const result = jobSchema.safeParse({ ...validJob, fit_score: 85.5 });
    expect(result.success).toBe(false);
  });
});

describe('createJobSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(createJobSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a fully populated object', () => {
    expect(
      createJobSchema.safeParse({
        title: 'Engineer',
        company: 'Acme',
        location: 'Remote',
        requirements: ['TypeScript'],
        tech_stack: ['Node.js'],
        salary_range: '$100k',
        status: 'saved',
        raw_description: '...',
        source: 'Indeed',
      }).success,
    ).toBe(true);
  });

  it('rejects an invalid status value', () => {
    expect(createJobSchema.safeParse({ status: 'unknown' }).success).toBe(
      false,
    );
  });

  it('rejects title longer than 255 characters', () => {
    expect(createJobSchema.safeParse({ title: 'a'.repeat(256) }).success).toBe(
      false,
    );
  });
});

describe('updateJobSchema', () => {
  it('is identical to createJobSchema — all fields optional', () => {
    expect(updateJobSchema.safeParse({}).success).toBe(true);
    expect(
      updateJobSchema.safeParse({ company: 'New Co', status: 'interviewing' })
        .success,
    ).toBe(true);
  });
});
