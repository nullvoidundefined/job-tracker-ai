import { beforeEach, describe, expect, it, vi } from "vitest";

import { query } from "app/db/pool/pool.js";
import * as authRepo from "app/repositories/auth/auth.js";
import { mockResult } from "app/utils/tests/mockResult.js";
import { uuid } from "app/utils/tests/uuids.js";

vi.mock("app/db/pool/pool.js", () => ({
  query: vi.fn(),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(() => Promise.resolve("hashed")),
    compare: vi.fn((plain: string, hash: string) =>
      Promise.resolve(hash === "hashed" && plain.length > 0),
    ),
  },
}));

const mockQuery = vi.mocked(query);

describe("auth repository", () => {
  const id = uuid();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createUser inserts and returns user", async () => {
    const row = { id, email: "u@example.com", created_at: new Date(), updated_at: new Date() };
    mockQuery.mockResolvedValueOnce(mockResult([row]));

    const result = await authRepo.createUser("u@example.com", "password123");

    expect(result).toEqual(row);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO users"), [
      "u@example.com",
      "hashed",
    ]);
  });

  it("createUser throws when insert returns no row", async () => {
    mockQuery.mockResolvedValueOnce(mockResult([], 0));
    await expect(authRepo.createUser("u@example.com", "pwd")).rejects.toThrow(
      "Insert returned no row",
    );
  });

  it("findUserByEmail returns user when found", async () => {
    const row = {
      id,
      email: "u@example.com",
      password_hash: "hashed",
      created_at: new Date(),
      updated_at: null,
    };
    mockQuery.mockResolvedValueOnce(mockResult([row]));

    const result = await authRepo.findUserByEmail("u@example.com");

    expect(result).toEqual(row);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT"), ["u@example.com"]);
  });

  it("findUserByEmail returns null when not found", async () => {
    mockQuery.mockResolvedValueOnce(mockResult([]));
    const result = await authRepo.findUserByEmail("nobody@example.com");
    expect(result).toBeNull();
  });

  it("findUserById returns user when found", async () => {
    const row = { id, email: "u@example.com", created_at: new Date(), updated_at: null };
    mockQuery.mockResolvedValueOnce(mockResult([row]));
    const result = await authRepo.findUserById(id);
    expect(result).toEqual(row);
  });

  it("findUserById returns null when not found", async () => {
    mockQuery.mockResolvedValueOnce(mockResult([]));
    const result = await authRepo.findUserById(id);
    expect(result).toBeNull();
  });

  it("verifyPassword returns true when match", async () => {
    const result = await authRepo.verifyPassword("pwd", "hashed");
    expect(result).toBe(true);
  });

  it("verifyPassword returns false when no match", async () => {
    const result = await authRepo.verifyPassword("pwd", "other");
    expect(result).toBe(false);
  });
});
