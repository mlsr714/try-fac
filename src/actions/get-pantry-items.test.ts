import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPantryItems } from "./get-pantry-items";

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
  pantryItems: {
    id: "id",
    userId: "user_id",
    name: "name",
    createdAt: "created_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ op: "eq", a, b })),
  asc: vi.fn((a) => ({ op: "asc", a })),
}));

const { auth } = await import("@clerk/nextjs/server");
const mockAuth = vi.mocked(auth);

describe("getPantryItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: "test-user-id",
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
  });

  it("returns pantry items for authenticated user", async () => {
    const mockItems = [
      { id: "item-1", name: "Salt", createdAt: new Date() },
      { id: "item-2", name: "Butter", createdAt: new Date() },
    ];
    mockOrderBy.mockResolvedValue(mockItems);

    const result = await getPantryItems();

    expect(result).toEqual({ items: mockItems });
    expect(mockSelect).toHaveBeenCalledTimes(1);
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue({
      userId: null,
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    const result = await getPantryItems();
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("returns error when database query fails", async () => {
    mockOrderBy.mockRejectedValue(new Error("DB error"));

    const result = await getPantryItems();
    expect(result).toEqual({ error: "Failed to fetch pantry items" });
  });

  it("returns empty array when user has no pantry items", async () => {
    mockOrderBy.mockResolvedValue([]);

    const result = await getPantryItems();
    expect(result).toEqual({ items: [] });
  });

  it("filters pantry items by the authenticated user ID", async () => {
    mockOrderBy.mockResolvedValue([]);

    await getPantryItems();

    expect(mockWhere).toHaveBeenCalledWith({
      op: "eq",
      a: "user_id",
      b: "test-user-id",
    });
  });
});
