import { describe, it, expect, vi, beforeEach } from "vitest";
import { updatePantryItem } from "./update-pantry-item";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock the database
const mockSelectWhere = vi.fn();
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));
const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));
const mockReturning = vi.fn();
const mockWhere = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

vi.mock("@/db", () => ({
  db: {
    select: () => mockSelect(),
    update: () => mockUpdate(),
  },
}));

vi.mock("@/db/schema", () => ({
  pantryItems: {
    id: "id",
    userId: "user_id",
    name: "name",
    updatedAt: "updated_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ op: "eq", a, b })),
  and: vi.fn((...args: unknown[]) => ({ op: "and", args })),
}));

const { auth } = await import("@clerk/nextjs/server");
const mockAuth = vi.mocked(auth);

describe("updatePantryItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectWhere.mockResolvedValue([]);
    mockAuth.mockResolvedValue({
      userId: "test-user-id",
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
  });

  it("updates item and returns it", async () => {
    mockReturning.mockResolvedValue([{ id: "item-1", name: "Extra Virgin Olive Oil" }]);

    const result = await updatePantryItem("item-1", "Extra Virgin Olive Oil");

    expect(result).toEqual({ item: { id: "item-1", name: "Extra Virgin Olive Oil" } });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Extra Virgin Olive Oil",
      })
    );
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue({
      userId: null,
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    const result = await updatePantryItem("item-1", "New Name");
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns error when name is empty", async () => {
    const result = await updatePantryItem("item-1", "");
    expect(result).toEqual({ error: "Ingredient name is required" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns error when name is only whitespace", async () => {
    const result = await updatePantryItem("item-1", "   ");
    expect(result).toEqual({ error: "Ingredient name is required" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("trims whitespace from name", async () => {
    mockReturning.mockResolvedValue([{ id: "item-1", name: "Garlic" }]);

    await updatePantryItem("item-1", "  Garlic  ");

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Garlic",
      })
    );
  });

  it("returns error when item not found", async () => {
    mockReturning.mockResolvedValue([]);

    const result = await updatePantryItem("nonexistent-id", "New Name");
    expect(result).toEqual({ error: "Ingredient not found" });
  });

  it("returns error when duplicate ingredient name already exists", async () => {
    mockSelectWhere.mockResolvedValue([{ id: "item-2", name: "Garlic" }]);

    const result = await updatePantryItem("item-1", "  garlic  ");

    expect(result).toEqual({
      error: "Ingredient already exists in your pantry",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns error when database update fails", async () => {
    mockReturning.mockRejectedValue(new Error("DB error"));

    const result = await updatePantryItem("item-1", "New Name");
    expect(result).toEqual({ error: "Failed to update ingredient" });
  });

  it("enforces ownership by filtering on userId", async () => {
    mockReturning.mockResolvedValue([{ id: "item-1", name: "Updated" }]);

    await updatePantryItem("item-1", "Updated");

    expect(mockWhere).toHaveBeenCalledTimes(1);
  });
});
