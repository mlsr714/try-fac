import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/get-recipes", () => ({
  getRecipes: vi.fn(),
}));

vi.mock("@/components/recipes-list", () => ({
  RecipesList: ({
    recipes,
  }: {
    recipes: Array<{ id: string; title: string; sourceType: string }>;
  }) => (
    <div data-testid="recipes-list">
      {recipes.map((recipe) => (
        <div key={recipe.id}>
          {recipe.title} ({recipe.sourceType})
        </div>
      ))}
    </div>
  ),
}));

const { getRecipes } = await import("@/actions/get-recipes");
const mockGetRecipes = vi.mocked(getRecipes);

import RecipesPage from "./page";

describe("RecipesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it("renders mixed generated and converted recipes after repeated page refreshes", async () => {
    const persistedRecipes = [
      {
        id: "generated-1",
        title: "Weeknight Tacos",
        summary: "Fast and fresh tacos.",
        sourceType: "generated",
        createdAt: new Date("2024-01-02"),
      },
      {
        id: "converted-1",
        title: "Thermomix Tomato Soup",
        summary: null,
        sourceType: "converted",
        createdAt: new Date("2024-01-01"),
      },
    ];

    mockGetRecipes.mockResolvedValue({ recipes: persistedRecipes });

    const firstRender = await RecipesPage();
    render(firstRender);

    expect(screen.getByText("My Recipes")).toBeInTheDocument();
    expect(screen.getByText("Weeknight Tacos (generated)")).toBeInTheDocument();
    expect(
      screen.getByText("Thermomix Tomato Soup (converted)")
    ).toBeInTheDocument();

    cleanup();

    const secondRender = await RecipesPage();
    render(secondRender);

    expect(screen.getByText("Weeknight Tacos (generated)")).toBeInTheDocument();
    expect(
      screen.getByText("Thermomix Tomato Soup (converted)")
    ).toBeInTheDocument();
    expect(mockGetRecipes).toHaveBeenCalledTimes(2);
  });

  it("renders an error message when recipe loading fails", async () => {
    mockGetRecipes.mockResolvedValue({ error: "Failed to fetch recipes" });

    const page = await RecipesPage();
    render(page);

    expect(screen.getByText("My Recipes")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch recipes")).toBeInTheDocument();
  });
});
