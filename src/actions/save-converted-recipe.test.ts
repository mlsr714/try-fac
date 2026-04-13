import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveConvertedRecipe } from "./save-converted-recipe";
import type { ConvertedRecipe } from "@/lib/schemas/conversion";

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

const mockConvertedRecipe: ConvertedRecipe = {
  title: "Garlic Butter Pasta",
  ingredients: [
    { name: "Spaghetti", amount: "200", unit: "g" },
    { name: "Garlic", amount: "3", unit: "cloves" },
    { name: "Butter", amount: "50", unit: "g" },
  ],
  steps: [
    { step: 1, text: "Boil pasta in salted water." },
    { step: 2, text: "Sauté garlic in butter until fragrant." },
    { step: 3, text: "Toss pasta with garlic butter." },
  ],
  thermomixInstructions: [
    {
      step: 1,
      text: "Boil water for pasta",
      speed: "Speed 1",
      temperature: "100°C",
      time: "10 min",
      bowl: "Main bowl",
      accessories: "None",
    },
    {
      step: 2,
      text: "Sauté garlic in butter",
      speed: "Speed 1",
      temperature: "Varoma",
      time: "3 min",
      bowl: "Main bowl",
      accessories: "Spatula",
    },
  ],
  warnings: null,
};

describe("saveConvertedRecipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: "test-user-id",
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
    mockReturning.mockResolvedValue([{ id: "converted-recipe-uuid-123" }]);
  });

  it("saves converted recipe and returns the ID", async () => {
    const result = await saveConvertedRecipe(mockConvertedRecipe);

    expect(result).toEqual({ id: "converted-recipe-uuid-123" });
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "test-user-id",
        title: "Garlic Butter Pasta",
        sourceType: "converted",
      })
    );
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue({
      userId: null,
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

    const result = await saveConvertedRecipe(mockConvertedRecipe);
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns error when database insert fails", async () => {
    mockReturning.mockRejectedValue(new Error("DB error"));

    const result = await saveConvertedRecipe(mockConvertedRecipe);
    expect(result).toEqual({ error: "Failed to save recipe" });
  });

  it("stores ingredients as JSON", async () => {
    await saveConvertedRecipe(mockConvertedRecipe);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        ingredients: mockConvertedRecipe.ingredients,
      })
    );
  });

  it("stores steps as instructions in the DB", async () => {
    await saveConvertedRecipe(mockConvertedRecipe);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: mockConvertedRecipe.steps,
      })
    );
  });

  it("stores thermomix instructions", async () => {
    await saveConvertedRecipe(mockConvertedRecipe);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        thermomixInstructions: mockConvertedRecipe.thermomixInstructions,
      })
    );
  });

  it("sets source type to converted", async () => {
    await saveConvertedRecipe(mockConvertedRecipe);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "converted",
      })
    );
  });

  it("sets nullable fields to null", async () => {
    await saveConvertedRecipe(mockConvertedRecipe);

    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: null,
        servings: null,
        activeTime: null,
        totalTime: null,
        nutrition: null,
        tools: null,
      })
    );
  });

  it("saves recipe with warnings present", async () => {
    const recipeWithWarnings: ConvertedRecipe = {
      ...mockConvertedRecipe,
      warnings: [
        "Assumed 200g flour",
        "Assumed baking at 180°C",
      ],
    };

    const result = await saveConvertedRecipe(recipeWithWarnings);
    expect(result).toEqual({ id: "converted-recipe-uuid-123" });
  });
});
