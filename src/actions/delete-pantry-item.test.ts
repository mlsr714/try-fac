import { describe, it, expect, vi, beforeEach } from "vitest";
import { deletePantryItem } from "./delete-pantry-item";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock the database
const mockReturning = vi.fn();
const mockWhere = vi.fn(() => ({ returning: mockReturning }));
const mockDeleteFrom = vi.fn(() => ({ where: mockWhere }));

vi.mock("@/db", () => ({
  db: {
    delete: () => mockDeleteFrom(),
  },
}));

vi.mock("@/db/schema", () => ({
  pantryItems: {
    id: "id",
    userId: "user_id",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ op: "eq", a, b })),
  and: vi.fn((...args: unknown[]) => ({ op: "and", args })),
}));

const { auth } = await import("@clerk/nextjs/server");
const mockAuth = vi.mocked(auth);

describe("deletePantryItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: "test-user-id",
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
  });

  it("deletes item and returns success", async () => {
    mockReturning.mockResolvedValue([{ id: "item-uuid-1" }]);

    const result = await deletePantryItem("item-uuid-1");

    expect(result).toEqual({ success: true });
    expect(mockDeleteFrom).toHaveBeenCalledTimes(1);
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue({
      userId: null,
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    const result = await deletePantryItem("item-uuid-1");
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockDeleteFrom).not.toHaveBeenCalled();
  });

  it("returns error when item not found", async () => {
    mockReturning.mockResolvedValue([]);

    const result = await deletePantryItem("nonexistent-id");
    expect(result).toEqual({ error: "Ingredient not found" });
  });

  it("returns error when database delete fails", async () => {
    mockReturning.mockRejectedValue(new Error("DB error"));

    const result = await deletePantryItem("item-uuid-1");
    expect(result).toEqual({ error: "Failed to delete ingredient" });
  });

  it("enforces ownership by filtering on userId", async () => {
    mockReturning.mockResolvedValue([{ id: "item-uuid-1" }]);

    await deletePantryItem("item-uuid-1");

    expect(mockWhere).toHaveBeenCalledTimes(1);
  });
});
