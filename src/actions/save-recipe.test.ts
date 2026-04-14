import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveRecipe } from "./save-recipe";
import type { FullRecipe } from "@/lib/schemas/generation";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/actions/sync-user", () => ({
  syncUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
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
  },
}));

const { auth } = await import("@clerk/nextjs/server");
const mockAuth = vi.mocked(auth);
const { syncUser } = await import("@/actions/sync-user");
const mockSyncUser = vi.mocked(syncUser);
const { revalidatePath } = await import("next/cache");
const mockRevalidatePath = vi.mocked(revalidatePath);

const mockRecipe: FullRecipe = {
  title: "Vegan Buddha Bowl",
  summary: "A hearty plant-based bowl.",
  servings: 4,
  activeTime: "25 min",
  totalTime: "35 min",
  ingredients: [
    { name: "Quinoa", amount: "1", unit: "cup" },
    { name: "Sweet Potato", amount: "2", unit: "medium" },
  ],
  instructions: [
    { step: 1, text: "Cook quinoa according to package instructions." },
    { step: 2, text: "Roast sweet potatoes at 400°F for 25 minutes." },
  ],
  nutrition: {
    calories: 450,
    protein: 15,
    carbs: 65,
    fat: 12,
  },
  tools: ["Baking sheet", "Saucepan"],
  thermomixInstructions: null,
};

describe("saveRecipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "test-user-id" } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
    mockSyncUser.mockResolvedValue({
      id: "test-user-id",
      email: "chef@example.com",
      name: "Test Chef",
      imageUrl: "https://example.com/avatar.png",
    });
    mockReturning.mockResolvedValue([{ id: "recipe-uuid-123" }]);
  });

  it("saves recipe and returns the ID", async () => {
    const result = await saveRecipe(mockRecipe);

    expect(result).toEqual({ id: "recipe-uuid-123" });
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "test-user-id",
        title: "Vegan Buddha Bowl",
        summary: "A hearty plant-based bowl.",
        servings: 4,
        sourceType: "generated",
      })
    );
    expect(mockSyncUser).toHaveBeenCalledTimes(1);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/recipes");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/recipes/recipe-uuid-123");
  });

  it("returns error when not authenticated", async () => {
    mockSyncUser.mockResolvedValue(null);

    const result = await saveRecipe(mockRecipe);
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when database insert fails", async () => {
    mockReturning.mockRejectedValue(new Error("DB error"));

    const result = await saveRecipe(mockRecipe);
    expect(result).toEqual({ error: "Failed to save recipe" });
  });

  it("saves recipe with thermomix instructions", async () => {
    const recipeWithThermomix: FullRecipe = {
      ...mockRecipe,
      thermomixInstructions: [
        {
          step: 1,
          text: "Blend ingredients",
          speed: "Speed 7",
          temperature: "37°C",
          time: "30 sec",
          bowl: "Main bowl",
        },
      ],
    };

    await saveRecipe(recipeWithThermomix);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        thermomixInstructions: recipeWithThermomix.thermomixInstructions,
      })
    );
  });

  it("stores all recipe fields", async () => {
    await saveRecipe(mockRecipe);

    expect(mockValues).toHaveBeenCalledTimes(1);
    const savedValues = (mockValues.mock.calls as unknown as Record<string, unknown>[][])[0]![0]!;
    expect(savedValues).toHaveProperty("title", "Vegan Buddha Bowl");
    expect(savedValues).toHaveProperty("summary", "A hearty plant-based bowl.");
    expect(savedValues).toHaveProperty("servings", 4);
    expect(savedValues).toHaveProperty("activeTime", "25 min");
    expect(savedValues).toHaveProperty("totalTime", "35 min");
    expect(savedValues).toHaveProperty("ingredients");
    expect(savedValues).toHaveProperty("instructions");
    expect(savedValues).toHaveProperty("nutrition");
    expect(savedValues).toHaveProperty("tools");
    expect(savedValues).toHaveProperty("thermomixInstructions", null);
    expect(savedValues).toHaveProperty("sourceType", "generated");
  });
});
