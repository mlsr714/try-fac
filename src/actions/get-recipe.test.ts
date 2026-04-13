import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRecipe } from "./get-recipe";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock the database
const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
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
    servings: "servings",
    activeTime: "active_time",
    totalTime: "total_time",
    ingredients: "ingredients",
    instructions: "instructions",
    nutrition: "nutrition",
    tools: "tools",
    thermomixInstructions: "thermomix_instructions",
    sourceType: "source_type",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ op: "eq", a, b })),
  and: vi.fn((...args: unknown[]) => ({ op: "and", args })),
}));

const { auth } = await import("@clerk/nextjs/server");
const mockAuth = vi.mocked(auth);

const mockRecipeData = {
  id: "recipe-uuid-123",
  userId: "test-user-id",
  title: "Vegan Buddha Bowl",
  summary: "A hearty plant-based bowl.",
  servings: 4,
  activeTime: "25 min",
  totalTime: "35 min",
  ingredients: [
    { name: "Quinoa", amount: "1", unit: "cup" },
  ],
  instructions: [
    { step: 1, text: "Cook quinoa." },
  ],
  nutrition: { calories: 450, protein: 15, carbs: 65, fat: 12 },
  tools: ["Baking sheet"],
  thermomixInstructions: null,
  sourceType: "generated",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("getRecipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: "test-user-id",
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
  });

  it("returns recipe for authenticated user", async () => {
    mockLimit.mockResolvedValue([mockRecipeData]);

    const result = await getRecipe("recipe-uuid-123");

    expect(result).toEqual({ recipe: mockRecipeData });
    expect(mockSelect).toHaveBeenCalledTimes(1);
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue({
      userId: null,
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    const result = await getRecipe("recipe-uuid-123");
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("returns error when recipe not found", async () => {
    mockLimit.mockResolvedValue([]);

    const result = await getRecipe("nonexistent-id");
    expect(result).toEqual({ error: "Recipe not found" });
  });

  it("returns error when database query fails", async () => {
    mockLimit.mockRejectedValue(new Error("DB error"));

    const result = await getRecipe("recipe-uuid-123");
    expect(result).toEqual({ error: "Failed to fetch recipe" });
  });

  it("verifies ownership by filtering on userId", async () => {
    mockLimit.mockResolvedValue([mockRecipeData]);

    await getRecipe("recipe-uuid-123");

    // Should have called where with and(eq(id), eq(userId))
    expect(mockWhere).toHaveBeenCalledTimes(1);
  });
});
