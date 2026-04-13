import { describe, it, expect, vi, beforeEach } from "vitest";
import { addPantryItem } from "./add-pantry-item";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock the database
const mockReturning = vi.fn();
const mockValues = vi.fn(() => ({ returning: mockReturning }));
const mockInsert = vi.fn(() => ({ values: mockValues }));

vi.mock("@/db", () => ({
  db: {
    insert: () => mockInsert(),
  },
}));

vi.mock("@/db/schema", () => ({
  pantryItems: {
    id: "id",
    userId: "user_id",
    name: "name",
  },
}));

const { auth } = await import("@clerk/nextjs/server");
const mockAuth = vi.mocked(auth);

describe("addPantryItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: "test-user-id",
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
  });

  it("adds item and returns it", async () => {
    mockReturning.mockResolvedValue([{ id: "item-uuid-1", name: "Olive Oil" }]);

    const result = await addPantryItem("Olive Oil");

    expect(result).toEqual({ item: { id: "item-uuid-1", name: "Olive Oil" } });
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "test-user-id",
        name: "Olive Oil",
      })
    );
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue({
      userId: null,
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    const result = await addPantryItem("Salt");
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when name is empty", async () => {
    const result = await addPantryItem("");
    expect(result).toEqual({ error: "Ingredient name is required" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when name is only whitespace", async () => {
    const result = await addPantryItem("   ");
    expect(result).toEqual({ error: "Ingredient name is required" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("trims whitespace from name", async () => {
    mockReturning.mockResolvedValue([{ id: "item-uuid-2", name: "Garlic" }]);

    await addPantryItem("  Garlic  ");

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Garlic",
      })
    );
  });

  it("returns error when database insert fails", async () => {
    mockReturning.mockRejectedValue(new Error("DB error"));

    const result = await addPantryItem("Salt");
    expect(result).toEqual({ error: "Failed to add ingredient" });
  });
});
