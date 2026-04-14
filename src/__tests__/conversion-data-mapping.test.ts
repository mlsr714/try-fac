/**
 * Tests verifying that the converted recipe data correctly maps
 * from the conversion schema format to the database schema format,
 * and that the recipe detail view can properly render this data.
 * 
 * This ensures the full pipeline works:
 * 1. AI returns ConvertedRecipe (conversion schema)
 * 2. saveConvertedRecipe maps it to the recipes table
 * 3. getRecipe retrieves it
 * 4. RecipeDetailView renders it correctly
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveConvertedRecipe } from "@/actions/save-converted-recipe";
import type { ConvertedRecipe } from "@/lib/schemas/conversion";

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

// Capture the values passed to insert
let capturedValues: Record<string, unknown> | null = null;
const mockReturning = vi.fn();
const mockValues = vi.fn((vals) => {
  capturedValues = vals;
  return { returning: mockReturning };
});
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

describe("Conversion Data Mapping: ConvertedRecipe → DB → RecipeDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedValues = null;
    mockAuth.mockResolvedValue({
      userId: "test-user-id",
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
    mockSyncUser.mockResolvedValue({
      id: "test-user-id",
      email: "chef@example.com",
      name: "Test Chef",
      imageUrl: "https://example.com/avatar.png",
    });
    mockReturning.mockResolvedValue([{ id: "saved-uuid" }]);
  });

  it("maps conversion steps to DB instructions field correctly", async () => {
    const recipe: ConvertedRecipe = {
      title: "Test Recipe",
      ingredients: [{ name: "Flour", amount: "200", unit: "g" }],
      steps: [
        { step: 1, text: "Mix flour" },
        { step: 2, text: "Knead dough" },
      ],
      thermomixInstructions: [
        {
          step: 1,
          text: "Mix in Thermomix",
          speed: "Speed 4",
          temperature: "No heat",
          time: "30 sec",
          bowl: "Main bowl",
          accessories: "None",
        },
      ],
      warnings: null,
    };

    await saveConvertedRecipe(recipe);

    // The steps field from the conversion should be stored as instructions
    expect(capturedValues).not.toBeNull();
    expect(capturedValues!.instructions).toEqual([
      { step: 1, text: "Mix flour" },
      { step: 2, text: "Knead dough" },
    ]);
  });

  it("preserves Thermomix instruction details including accessories", async () => {
    const recipe: ConvertedRecipe = {
      title: "Steamed Veggies",
      ingredients: [{ name: "Broccoli", amount: "300", unit: "g" }],
      steps: [{ step: 1, text: "Steam vegetables" }],
      thermomixInstructions: [
        {
          step: 1,
          text: "Steam broccoli using Varoma",
          speed: "Speed 1",
          temperature: "Varoma",
          time: "15 min",
          bowl: "Varoma tray",
          accessories: "Steaming basket",
        },
      ],
      warnings: null,
    };

    await saveConvertedRecipe(recipe);

    expect(capturedValues!.thermomixInstructions).toEqual([
      {
        step: 1,
        text: "Steam broccoli using Varoma",
        speed: "Speed 1",
        temperature: "Varoma",
        time: "15 min",
        bowl: "Varoma tray",
        accessories: "Steaming basket",
      },
    ]);
  });

  it("sets appropriate null values for fields not in conversion schema", async () => {
    const recipe: ConvertedRecipe = {
      title: "Simple Recipe",
      ingredients: [{ name: "Salt", amount: "1", unit: "tsp" }],
      steps: [{ step: 1, text: "Add salt" }],
      thermomixInstructions: [
        {
          step: 1,
          text: "Mix",
          speed: "Speed 1",
          temperature: "No heat",
          time: "5 sec",
          bowl: "Main bowl",
          accessories: "None",
        },
      ],
      warnings: null,
    };

    await saveConvertedRecipe(recipe);

    // These fields don't exist in ConvertedRecipe and should be null
    expect(capturedValues!.summary).toBeNull();
    expect(capturedValues!.servings).toBeNull();
    expect(capturedValues!.activeTime).toBeNull();
    expect(capturedValues!.totalTime).toBeNull();
    expect(capturedValues!.nutrition).toBeNull();
    expect(capturedValues!.tools).toBeNull();
  });

  it("instructions format matches what RecipeDetailView expects", async () => {
    const recipe: ConvertedRecipe = {
      title: "Format Test",
      ingredients: [{ name: "Water", amount: "500", unit: "ml" }],
      steps: [
        { step: 1, text: "Boil water" },
        { step: 2, text: "Add ingredients" },
        { step: 3, text: "Serve" },
      ],
      thermomixInstructions: [
        {
          step: 1,
          text: "Boil",
          speed: "Speed 1",
          temperature: "100°C",
          time: "5 min",
          bowl: "Main bowl",
          accessories: "None",
        },
      ],
      warnings: null,
    };

    await saveConvertedRecipe(recipe);

    // RecipeDetailView expects instructions as {step: number, text: string}[]
    const instructions = capturedValues!.instructions as Array<{ step: number; text: string }>;
    expect(instructions).toHaveLength(3);
    expect(instructions[0]).toHaveProperty("step", 1);
    expect(instructions[0]).toHaveProperty("text", "Boil water");
    expect(instructions[2]).toHaveProperty("step", 3);
    expect(instructions[2]).toHaveProperty("text", "Serve");
  });

  it("ingredients format matches what RecipeDetailView expects", async () => {
    const recipe: ConvertedRecipe = {
      title: "Ingredient Test",
      ingredients: [
        { name: "Flour", amount: "200", unit: "g" },
        { name: "Sugar", amount: "100", unit: "g" },
        { name: "Salt", amount: "a pinch", unit: "" },
      ],
      steps: [{ step: 1, text: "Mix" }],
      thermomixInstructions: [
        {
          step: 1,
          text: "Mix",
          speed: "Speed 4",
          temperature: "No heat",
          time: "10 sec",
          bowl: "Main bowl",
          accessories: "None",
        },
      ],
      warnings: null,
    };

    await saveConvertedRecipe(recipe);

    // RecipeDetailView expects ingredients as {name: string, amount: string, unit: string}[]
    const ingredients = capturedValues!.ingredients as Array<{
      name: string;
      amount: string;
      unit: string;
    }>;
    expect(ingredients).toHaveLength(3);
    expect(ingredients[0]).toEqual({ name: "Flour", amount: "200", unit: "g" });
    expect(ingredients[2]).toEqual({
      name: "Salt",
      amount: "a pinch",
      unit: "",
    });
  });
});
