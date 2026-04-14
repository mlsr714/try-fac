import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetRecipes = vi.fn();
const mockGetPantryItems = vi.fn();
const mockAddPantryItem = vi.fn();
const mockUpdatePantryItem = vi.fn();
const mockDeletePantryItem = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/actions/get-recipes", () => ({
  getRecipes: () => mockGetRecipes(),
}));

vi.mock("@/actions/get-pantry-items", () => ({
  getPantryItems: () => mockGetPantryItems(),
}));

vi.mock("@/actions/add-pantry-item", () => ({
  addPantryItem: (...args: unknown[]) => mockAddPantryItem(...args),
}));

vi.mock("@/actions/update-pantry-item", () => ({
  updatePantryItem: (...args: unknown[]) => mockUpdatePantryItem(...args),
}));

vi.mock("@/actions/delete-pantry-item", () => ({
  deletePantryItem: (...args: unknown[]) => mockDeletePantryItem(...args),
}));

import PantryPage from "@/app/pantry/page";
import RecipesPage from "@/app/recipes/page";

type PantryStoreItem = { id: string; name: string; createdAt: Date };
type RecipeStoreItem = {
  id: string;
  title: string;
  summary: string | null;
  sourceType: string;
  createdAt: Date;
};

describe("Cross-Flow: Concurrent feature use remains stable", () => {
  let pantryItems: PantryStoreItem[];
  let recipes: RecipeStoreItem[];
  let itemCount = 0;

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();

    pantryItems = [
      { id: "item-1", name: "Rice", createdAt: new Date("2024-01-01") },
      { id: "item-2", name: "Olive Oil", createdAt: new Date("2024-01-02") },
    ];
    recipes = [];
    itemCount = 3;

    mockGetPantryItems.mockImplementation(async () => ({
      items: [...pantryItems],
    }));
    mockGetRecipes.mockImplementation(async () => ({
      recipes: [...recipes].sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime()
      ),
    }));
    mockAddPantryItem.mockImplementation(async (name: string) => {
      const item = {
        id: `item-${itemCount++}`,
        name: name.trim(),
        createdAt: new Date("2024-01-03"),
      };

      pantryItems = [...pantryItems, item].sort((left, right) =>
        left.name.localeCompare(right.name)
      );

      return {
        item: {
          id: item.id,
          name: item.name,
        },
      };
    });
    mockUpdatePantryItem.mockResolvedValue({
      item: {
        id: "item-1",
        name: "Rice",
      },
    });
    mockDeletePantryItem.mockResolvedValue({ success: true });
  });

  it("keeps pantry items intact after pantry add, recipe generation, and recipe conversion", async () => {
    const user = userEvent.setup();

    const pantryPage = await PantryPage();
    const pantryView = render(pantryPage);

    await user.type(screen.getByTestId("add-ingredient-input"), "Garlic");
    await user.click(screen.getByTestId("add-ingredient-button"));

    expect(screen.getByText("Garlic")).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
    expect(screen.getByText("Olive Oil")).toBeInTheDocument();

    recipes = [
      {
        id: "generated-1",
        title: "Weeknight Tacos",
        summary: "Fast and fresh tacos.",
        sourceType: "generated",
        createdAt: new Date("2024-01-03T10:00:00Z"),
      },
      {
        id: "converted-1",
        title: "Thermomix Tomato Soup",
        summary: null,
        sourceType: "converted",
        createdAt: new Date("2024-01-03T10:05:00Z"),
      },
    ];

    pantryView.unmount();

    const recipesPage = await RecipesPage();
    const recipesView = render(recipesPage);

    expect(screen.getByText("Thermomix Tomato Soup")).toBeInTheDocument();
    expect(screen.getByText("Weeknight Tacos")).toBeInTheDocument();
    expect(screen.getByText("Converted")).toBeInTheDocument();
    expect(screen.getByText("Generated")).toBeInTheDocument();

    recipesView.unmount();

    const pantryPageAfterRecipes = await PantryPage();
    render(pantryPageAfterRecipes);

    expect(screen.getByText("Garlic")).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
    expect(screen.getByText("Olive Oil")).toBeInTheDocument();
    expect(mockGetPantryItems).toHaveBeenCalledTimes(2);
    expect(mockGetRecipes).toHaveBeenCalledTimes(1);
  });
});
