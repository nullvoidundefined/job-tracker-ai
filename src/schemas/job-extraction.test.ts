import {
  fitScoreSchema,
  jobExtractionSchema,
} from 'app/schemas/job-extraction.js';
import { describe, expect, it } from 'vitest';

describe('jobExtractionSchema', () => {
  it('validates a complete extraction', () => {
    const result = jobExtractionSchema.safeParse({
      title: 'Engineer',
      company: 'Acme',
      location: 'Remote',
      requirements: ['TypeScript'],
      tech_stack: ['Node.js'],
      salary_range: '$120k',
    });
    expect(result.success).toBe(true);
  });

  it('allows null for optional fields', () => {
    const result = jobExtractionSchema.safeParse({
      title: null,
      company: null,
      location: null,
      requirements: [],
      tech_stack: [],
      salary_range: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required array fields', () => {
    const result = jobExtractionSchema.safeParse({
      title: 'Engineer',
      company: 'Acme',
    });
    expect(result.success).toBe(false);
  });
});

describe('fitScoreSchema', () => {
  it('validates a valid fit score', () => {
    const result = fitScoreSchema.safeParse({
      score: 85,
      explanation: 'Good fit',
    });
    expect(result.success).toBe(true);
  });

  it('rejects score above 100', () => {
    const result = fitScoreSchema.safeParse({
      score: 101,
      explanation: 'Too high',
    });
    expect(result.success).toBe(false);
  });

  it('rejects score below 0', () => {
    const result = fitScoreSchema.safeParse({
      score: -1,
      explanation: 'Too low',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer score', () => {
    const result = fitScoreSchema.safeParse({
      score: 85.5,
      explanation: 'Decimal',
    });
    expect(result.success).toBe(false);
  });
});
