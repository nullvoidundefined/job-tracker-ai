import { describe, expect, it } from "vitest";

import { uuid } from "app/utils/tests/uuids.js";

import { profileSchema, updateProfileSchema } from "./profile.js";

const validProfile = {
  id: uuid(),
  user_id: uuid(),
  skills: ["TypeScript", "Node.js"],
  experience_summary: "5 years backend",
  education: "BSc Computer Science",
  job_title: "Software Engineer",
  years_of_experience: 5,
  created_at: new Date().toISOString(),
  updated_at: null,
};

describe("profileSchema", () => {
  it("accepts a complete profile", () => {
    expect(profileSchema.safeParse(validProfile).success).toBe(true);
  });

  it("accepts all nullable fields as null", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      experience_summary: null,
      education: null,
      job_title: null,
      years_of_experience: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty skills array", () => {
    expect(profileSchema.safeParse({ ...validProfile, skills: [] }).success).toBe(true);
  });

  it("rejects invalid uuid for id", () => {
    expect(profileSchema.safeParse({ ...validProfile, id: "not-a-uuid" }).success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts empty object", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update with skills only", () => {
    expect(updateProfileSchema.safeParse({ skills: ["Go", "Rust"] }).success).toBe(true);
  });

  it("accepts full update", () => {
    const result = updateProfileSchema.safeParse({
      skills: ["TypeScript"],
      experience_summary: "3 years",
      education: "MSc",
      job_title: "Staff Engineer",
      years_of_experience: 3,
    });
    expect(result.success).toBe(true);
  });

  it("rejects years_of_experience above 100", () => {
    expect(updateProfileSchema.safeParse({ years_of_experience: 101 }).success).toBe(false);
  });

  it("rejects years_of_experience below 0", () => {
    expect(updateProfileSchema.safeParse({ years_of_experience: -1 }).success).toBe(false);
  });

  it("rejects job_title over 255 characters", () => {
    expect(updateProfileSchema.safeParse({ job_title: "a".repeat(256) }).success).toBe(false);
  });
});
