import { beforeEach, describe, expect, it, vi } from "vitest";

import * as pool from "app/db/pool/pool.js";

import * as profileRepo from "./profile.js";

vi.mock("app/db/pool/pool.js", () => ({ query: vi.fn() }));

const mockQuery = vi.mocked(pool.query);

const mockProfile = {
  id: "00000000-0000-0000-0000-000000000001",
  user_id: "00000000-0000-0000-0000-000000000002",
  skills: ["TypeScript"],
  experience_summary: "5 years",
  education: null,
  job_title: "Engineer",
  years_of_experience: 5,
  created_at: new Date(),
  updated_at: null,
};

beforeEach(() => vi.clearAllMocks());

describe("getProfile", () => {
  it("returns profile when found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockProfile] } as never);
    const result = await profileRepo.getProfile(mockProfile.user_id);
    expect(result).toEqual(mockProfile);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("resume_profiles"), [
      mockProfile.user_id,
    ]);
  });

  it("returns null when not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);
    const result = await profileRepo.getProfile(mockProfile.user_id);
    expect(result).toBeNull();
  });
});

describe("upsertProfile", () => {
  it("returns existing profile when called with no fields and profile exists", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockProfile] } as never);
    const result = await profileRepo.upsertProfile(mockProfile.user_id, {});
    expect(result).toEqual(mockProfile);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("inserts blank profile when called with no fields and no profile exists", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rows: [mockProfile] } as never);
    const result = await profileRepo.upsertProfile(mockProfile.user_id, {});
    expect(result).toEqual(mockProfile);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("upserts when fields are provided", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockProfile] } as never);
    const result = await profileRepo.upsertProfile(mockProfile.user_id, {
      skills: ["TypeScript"],
      years_of_experience: 5,
    });
    expect(result).toEqual(mockProfile);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("ON CONFLICT"),
      expect.arrayContaining([mockProfile.user_id]),
    );
  });

  it("throws when insert returns no row", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);
    await expect(profileRepo.upsertProfile(mockProfile.user_id, {})).rejects.toThrow(
      "Insert returned no row",
    );
  });
});
