import { query } from 'app/db/pool/pool.js';
import * as jobsRepo from 'app/repositories/jobs/jobs.js';
import type { Job } from 'app/schemas/job.js';
import { mockResult } from 'app/utils/tests/mockResult.js';
import { uuid } from 'app/utils/tests/uuids.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('app/db/pool/pool.js', () => ({ query: vi.fn() }));

const mockQuery = vi.mocked(query);

const userId = uuid();
const jobId = uuid();

const mockJob: Job = {
  id: jobId,
  user_id: userId,
  title: 'Engineer',
  company: 'Acme',
  location: 'Remote',
  requirements: ['TypeScript'],
  tech_stack: ['Node.js'],
  salary_range: '$120k',
  fit_score: null,
  fit_explanation: null,
  status: 'applied',
  raw_description: null,
  source: null,
  created_at: new Date('2025-01-01'),
  updated_at: null,
};

describe('jobs repository', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('listJobs', () => {
    it('returns jobs and total count', async () => {
      mockQuery
        .mockResolvedValueOnce(mockResult([mockJob]))
        .mockResolvedValueOnce(mockResult([{ count: '3' }]));

      const result = await jobsRepo.listJobs(userId, 50, 0);

      expect(result.jobs).toEqual([mockJob]);
      expect(result.total).toBe(3);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('returns empty list when no jobs', async () => {
      mockQuery
        .mockResolvedValueOnce(mockResult([]))
        .mockResolvedValueOnce(mockResult([{ count: '0' }]));

      const result = await jobsRepo.listJobs(userId, 50, 0);

      expect(result.jobs).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getJobById', () => {
    it('returns job when found', async () => {
      mockQuery.mockResolvedValueOnce(mockResult([mockJob]));
      const result = await jobsRepo.getJobById(jobId, userId);
      expect(result).toEqual(mockJob);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [jobId, userId],
      );
    });

    it('returns null when not found', async () => {
      mockQuery.mockResolvedValueOnce(mockResult([]));
      const result = await jobsRepo.getJobById(jobId, userId);
      expect(result).toBeNull();
    });
  });

  describe('createJob', () => {
    it('inserts and returns job', async () => {
      mockQuery.mockResolvedValueOnce(mockResult([mockJob]));

      const result = await jobsRepo.createJob(userId, {
        title: 'Engineer',
        company: 'Acme',
      });

      expect(result).toEqual(mockJob);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO jobs'),
        expect.arrayContaining([userId, 'Engineer', 'Acme']),
      );
    });

    it('throws when insert returns no row', async () => {
      mockQuery.mockResolvedValueOnce(mockResult([], 0));
      await expect(jobsRepo.createJob(userId, {})).rejects.toThrow(
        'Insert returned no row',
      );
    });
  });

  describe('updateJob', () => {
    it('updates and returns job when found', async () => {
      const updated = { ...mockJob, title: 'Senior Engineer' };
      mockQuery.mockResolvedValueOnce(mockResult([updated]));

      const result = await jobsRepo.updateJob(jobId, userId, {
        title: 'Senior Engineer',
      });

      expect(result).toEqual(updated);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE jobs SET'),
        expect.arrayContaining([jobId, userId, 'Senior Engineer']),
      );
    });

    it('returns null when job not found', async () => {
      mockQuery.mockResolvedValueOnce(mockResult([]));
      const result = await jobsRepo.updateJob(jobId, userId, { title: 'X' });
      expect(result).toBeNull();
    });

    it('falls back to getJobById when input is empty', async () => {
      mockQuery.mockResolvedValueOnce(mockResult([mockJob]));
      const result = await jobsRepo.updateJob(jobId, userId, {});
      expect(result).toEqual(mockJob);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [jobId, userId],
      );
    });
  });

  describe('deleteJob', () => {
    it('returns true when deleted', async () => {
      mockQuery.mockResolvedValueOnce(mockResult([], 1));
      const result = await jobsRepo.deleteJob(jobId, userId);
      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM jobs'),
        [jobId, userId],
      );
    });

    it('returns false when not found', async () => {
      mockQuery.mockResolvedValueOnce(mockResult([], 0));
      const result = await jobsRepo.deleteJob(jobId, userId);
      expect(result).toBe(false);
    });
  });
});
