import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRecipes } from "./get-recipes";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock the database
const mockOrderBy = vi.fn();
const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

vi.mock("@/db", () => ({
  db: {
    select: () => mockSelect(),
  },
}));

vi.mock("@/db/schema", () => ({
  recipes: {
    id: "id",
    userId: "user_id",
    title: "title",
    summary: "summary",
    sourceType: "source_type",
    createdAt: "created_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ op: "eq", a, b })),
  desc: vi.fn((a) => ({ op: "desc", a })),
}));

const { auth } = await import("@clerk/nextjs/server");
const mockAuth = vi.mocked(auth);

describe("getRecipes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: "test-user-id",
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
  });

  it("returns recipes for authenticated user", async () => {
    const mockRecipes = [
      {
        id: "recipe-1",
        title: "Recipe One",
        summary: "Summary one",
        sourceType: "generated",
        createdAt: new Date("2024-01-02"),
      },
      {
        id: "recipe-2",
        title: "Recipe Two",
        summary: null,
        sourceType: "converted",
        createdAt: new Date("2024-01-01"),
      },
    ];
    mockOrderBy.mockResolvedValue(mockRecipes);

    const result = await getRecipes();

    expect(result).toEqual({ recipes: mockRecipes });
    expect(mockSelect).toHaveBeenCalledTimes(1);
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue({
      userId: null,
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    const result = await getRecipes();
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("returns error when database query fails", async () => {
    mockOrderBy.mockRejectedValue(new Error("DB error"));

    const result = await getRecipes();
    expect(result).toEqual({ error: "Failed to fetch recipes" });
  });

  it("returns empty array when user has no recipes", async () => {
    mockOrderBy.mockResolvedValue([]);

    const result = await getRecipes();
    expect(result).toEqual({ recipes: [] });
  });

  it("filters recipes by the authenticated user ID", async () => {
    mockOrderBy.mockResolvedValue([]);

    await getRecipes();

    expect(mockWhere).toHaveBeenCalledWith({
      op: "eq",
      a: "user_id",
      b: "test-user-id",
    });
  });

  it("returns the same user's recipes after signing back in", async () => {
    const persistedRecipes = [
      {
        id: "recipe-1",
        title: "Saved Across Sessions",
        summary: "Still there after re-authentication",
        sourceType: "generated",
        createdAt: new Date("2024-01-02"),
      },
      {
        id: "recipe-2",
        title: "Converted Across Sessions",
        summary: null,
        sourceType: "converted",
        createdAt: new Date("2024-01-01"),
      },
    ];

    mockAuth
      .mockResolvedValueOnce({
        userId: "test-user-id",
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
      .mockResolvedValueOnce({
        userId: null,
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
      .mockResolvedValueOnce({
        userId: "test-user-id",
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
    mockOrderBy.mockResolvedValue(persistedRecipes);

    const firstSession = await getRecipes();
    const signedOut = await getRecipes();
    const secondSession = await getRecipes();

    expect(firstSession).toEqual({ recipes: persistedRecipes });
    expect(signedOut).toEqual({ error: "Not authenticated" });
    expect(secondSession).toEqual({ recipes: persistedRecipes });
    expect(mockOrderBy).toHaveBeenCalledTimes(2);
  });
});
