import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/actions/get-recipe", () => ({
  getRecipe: vi.fn(),
}));

vi.mock("@/components/recipe-detail-view", () => ({
  RecipeDetailView: ({ recipe }: { recipe: { title: string } }) => (
    <div data-testid="recipe-detail-view">{recipe.title}</div>
  ),
}));

const { notFound } = await import("next/navigation");
const { getRecipe } = await import("@/actions/get-recipe");

const mockNotFound = vi.mocked(notFound);
const mockGetRecipe = vi.mocked(getRecipe);

import RecipeDetailPage from "./page";

describe("RecipeDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the recipe detail view when the recipe exists", async () => {
    mockGetRecipe.mockResolvedValue({
      recipe: {
        id: "recipe-1",
        title: "Thermomix Tomato Soup",
        summary: null,
        servings: null,
        activeTime: null,
        totalTime: null,
        ingredients: [],
        instructions: [],
        nutrition: null,
        tools: null,
        thermomixInstructions: [],
        sourceType: "converted",
        createdAt: new Date("2024-01-01"),
      },
    });

    const page = await RecipeDetailPage({
      params: Promise.resolve({ id: "recipe-1" }),
    });
    render(page);

    expect(screen.getByTestId("recipe-detail-view")).toHaveTextContent(
      "Thermomix Tomato Soup"
    );
  });

  it("returns notFound when the recipe has been deleted", async () => {
    mockGetRecipe.mockResolvedValue({ error: "Recipe not found" });

    await expect(
      RecipeDetailPage({
        params: Promise.resolve({ id: "deleted-recipe" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("renders non-404 fetch errors inline", async () => {
    mockGetRecipe.mockResolvedValue({ error: "Failed to fetch recipe" });

    const page = await RecipeDetailPage({
      params: Promise.resolve({ id: "recipe-1" }),
    });
    render(page);

    expect(screen.getByText("Failed to fetch recipe")).toBeInTheDocument();
  });
});
