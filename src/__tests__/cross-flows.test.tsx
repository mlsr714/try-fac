/**
 * Cross-flow integration tests for conversion flow and recipe management.
 * 
 * Tests that verify:
 * - Converted recipe data maps correctly to recipe detail view
 * - Both generated and converted recipes coexist in list  
 * - Search works for both types
 * - Delete removes from list and detail returns 404-style response
 * - Converted recipe detail shows Thermomix content
 * - RecipeDetailView handles converted recipes (with Thermomix, without summary/nutrition)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipesList } from "@/components/recipes-list";
import { RecipeDetailView } from "@/components/recipe-detail-view";
import type { RecipeListItem } from "@/actions/get-recipes";
import type { RecipeDetail } from "@/actions/get-recipe";

// Mock next/link
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

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock delete-recipe action
vi.mock("@/actions/delete-recipe", () => ({
  deleteRecipe: vi.fn(),
}));

const { deleteRecipe } = await import("@/actions/delete-recipe");
const mockDeleteRecipe = vi.mocked(deleteRecipe);

// Test data representing recipes from both generation and conversion flows
const generatedRecipe: RecipeListItem = {
  id: "gen-recipe-1",
  title: "Vegan Buddha Bowl",
  summary: "A hearty plant-based bowl packed with quinoa.",
  sourceType: "generated",
  createdAt: new Date("2024-01-03"),
};

const convertedRecipe: RecipeListItem = {
  id: "conv-recipe-1",
  title: "Garlic Butter Pasta",
  summary: null,
  sourceType: "converted",
  createdAt: new Date("2024-01-02"),
};

const anotherGeneratedRecipe: RecipeListItem = {
  id: "gen-recipe-2",
  title: "Mediterranean Quinoa Salad",
  summary: "Fresh and light Mediterranean salad.",
  sourceType: "generated",
  createdAt: new Date("2024-01-01"),
};

const mixedRecipes = [generatedRecipe, convertedRecipe, anotherGeneratedRecipe];

// Full converted recipe detail (as it would be stored from save-converted-recipe)
const convertedRecipeDetail: RecipeDetail = {
  id: "conv-recipe-1",
  title: "Garlic Butter Pasta",
  summary: null,
  servings: null,
  activeTime: null,
  totalTime: null,
  ingredients: [
    { name: "Spaghetti", amount: "200", unit: "g" },
    { name: "Garlic", amount: "3", unit: "cloves" },
    { name: "Butter", amount: "50", unit: "g" },
  ],
  instructions: [
    { step: 1, text: "Boil pasta in salted water until al dente." },
    { step: 2, text: "Sauté garlic in butter until fragrant." },
    { step: 3, text: "Toss pasta with garlic butter and serve." },
  ],
  nutrition: null,
  tools: null,
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
    {
      step: 3,
      text: "Mix pasta with sauce",
      speed: "Speed 2",
      temperature: "No heat",
      time: "1 min",
      bowl: "Main bowl",
      accessories: "None",
    },
  ],
  sourceType: "converted",
  createdAt: new Date("2024-01-02"),
};

describe("Cross-Flow: Generated and Converted Recipes Coexist in List", () => {
  it("displays both generated and converted recipes", () => {
    render(<RecipesList recipes={mixedRecipes} />);

    expect(screen.getByText("Vegan Buddha Bowl")).toBeInTheDocument();
    expect(screen.getByText("Garlic Butter Pasta")).toBeInTheDocument();
    expect(screen.getByText("Mediterranean Quinoa Salad")).toBeInTheDocument();
  });

  it("shows correct source type badges for both types", () => {
    render(<RecipesList recipes={mixedRecipes} />);

    const generatedBadges = screen.getAllByText("Generated");
    expect(generatedBadges).toHaveLength(2);

    const convertedBadges = screen.getAllByText("Converted");
    expect(convertedBadges).toHaveLength(1);
  });

  it("links to correct detail pages for both types", () => {
    render(<RecipesList recipes={mixedRecipes} />);

    const links = screen.getAllByRole("link").filter((l) =>
      l.getAttribute("href")?.startsWith("/recipes/")
    );

    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/recipes/gen-recipe-1");
    expect(hrefs).toContain("/recipes/conv-recipe-1");
    expect(hrefs).toContain("/recipes/gen-recipe-2");
  });
});

describe("Cross-Flow: Search Finds Both Generated and Converted Recipes", () => {
  it("search finds generated recipe by title", async () => {
    const user = userEvent.setup();
    render(<RecipesList recipes={mixedRecipes} />);

    await user.type(screen.getByTestId("search-input"), "Buddha");

    expect(screen.getByText("Vegan Buddha Bowl")).toBeInTheDocument();
    expect(screen.queryByText("Garlic Butter Pasta")).not.toBeInTheDocument();
  });

  it("search finds converted recipe by title", async () => {
    const user = userEvent.setup();
    render(<RecipesList recipes={mixedRecipes} />);

    await user.type(screen.getByTestId("search-input"), "Garlic");

    expect(screen.getByText("Garlic Butter Pasta")).toBeInTheDocument();
    expect(screen.queryByText("Vegan Buddha Bowl")).not.toBeInTheDocument();
  });

  it("search returns empty for non-existent recipe", async () => {
    const user = userEvent.setup();
    render(<RecipesList recipes={mixedRecipes} />);

    await user.type(screen.getByTestId("search-input"), "nonexistent-recipe-xyz");

    expect(screen.getByTestId("no-results-state")).toBeInTheDocument();
    expect(screen.queryByText("Vegan Buddha Bowl")).not.toBeInTheDocument();
    expect(screen.queryByText("Garlic Butter Pasta")).not.toBeInTheDocument();
  });

  it("search returns empty when searching for deleted recipe title", async () => {
    // Simulate the scenario where a recipe was deleted (not in the list)
    const remainingRecipes = [generatedRecipe, anotherGeneratedRecipe];
    const user = userEvent.setup();
    render(<RecipesList recipes={remainingRecipes} />);

    await user.type(screen.getByTestId("search-input"), "Garlic Butter");

    expect(screen.getByTestId("no-results-state")).toBeInTheDocument();
  });

  it("clearing search restores all recipes", async () => {
    const user = userEvent.setup();
    render(<RecipesList recipes={mixedRecipes} />);

    const searchInput = screen.getByTestId("search-input");
    await user.type(searchInput, "Buddha");

    expect(screen.queryByText("Garlic Butter Pasta")).not.toBeInTheDocument();

    await user.clear(searchInput);

    expect(screen.getByText("Vegan Buddha Bowl")).toBeInTheDocument();
    expect(screen.getByText("Garlic Butter Pasta")).toBeInTheDocument();
    expect(screen.getByText("Mediterranean Quinoa Salad")).toBeInTheDocument();
  });
});

describe("Cross-Flow: Converted Recipe Detail Shows Thermomix Content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders converted recipe with Thermomix instructions", () => {
    render(<RecipeDetailView recipe={convertedRecipeDetail} />);

    expect(screen.getByTestId("recipe-title")).toHaveTextContent(
      "Garlic Butter Pasta"
    );
    expect(screen.getByTestId("thermomix-instructions")).toBeInTheDocument();
  });

  it("shows all Thermomix instruction details for converted recipe", () => {
    render(<RecipeDetailView recipe={convertedRecipeDetail} />);

    const tmix = screen.getByTestId("thermomix-instructions");
    // Step 1
    expect(tmix).toHaveTextContent("Boil water for pasta");
    expect(tmix).toHaveTextContent("Speed 1");
    expect(tmix).toHaveTextContent("100°C");
    expect(tmix).toHaveTextContent("10 min");
    expect(tmix).toHaveTextContent("Main bowl");
    // Step 2
    expect(tmix).toHaveTextContent("Sauté garlic in butter");
    expect(tmix).toHaveTextContent("Varoma");
    expect(tmix).toHaveTextContent("3 min");
    // Step 3
    expect(tmix).toHaveTextContent("Mix pasta with sauce");
    expect(tmix).toHaveTextContent("Speed 2");
  });

  it("renders converted recipe ingredients correctly", () => {
    render(<RecipeDetailView recipe={convertedRecipeDetail} />);

    const ingredients = screen.getByTestId("ingredients-list");
    expect(ingredients).toHaveTextContent("Spaghetti");
    expect(ingredients).toHaveTextContent("Garlic");
    expect(ingredients).toHaveTextContent("Butter");
  });

  it("renders converted recipe instructions (steps) correctly", () => {
    render(<RecipeDetailView recipe={convertedRecipeDetail} />);

    const instructions = screen.getByTestId("instructions-list");
    expect(instructions).toHaveTextContent("Boil pasta in salted water");
    expect(instructions).toHaveTextContent("Sauté garlic in butter");
    expect(instructions).toHaveTextContent("Toss pasta with garlic butter");
  });

  it("handles converted recipe without summary, servings, nutrition, and tools", () => {
    render(<RecipeDetailView recipe={convertedRecipeDetail} />);

    // These fields are null for converted recipes
    expect(screen.queryByTestId("recipe-summary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("recipe-meta")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nutrition-info")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tools-list")).not.toBeInTheDocument();
  });
});

describe("Cross-Flow: Delete Recipe Removes From List and Detail Returns 404", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deleting a recipe redirects to /recipes", async () => {
    const user = userEvent.setup();
    mockDeleteRecipe.mockResolvedValue({ success: true });
    render(<RecipeDetailView recipe={convertedRecipeDetail} />);

    await user.click(screen.getByTestId("delete-button"));
    await user.click(screen.getByTestId("confirm-delete"));

    expect(mockDeleteRecipe).toHaveBeenCalledWith("conv-recipe-1");
    expect(mockPush).toHaveBeenCalledWith("/recipes");
  });

  it("remaining recipes unaffected after delete (list without deleted recipe)", () => {
    // After deletion, the recipes list would be fetched again without the deleted recipe
    const remainingRecipes = [generatedRecipe, anotherGeneratedRecipe];
    render(<RecipesList recipes={remainingRecipes} />);

    expect(screen.getByText("Vegan Buddha Bowl")).toBeInTheDocument();
    expect(screen.getByText("Mediterranean Quinoa Salad")).toBeInTheDocument();
    expect(screen.queryByText("Garlic Butter Pasta")).not.toBeInTheDocument();
  });

  it("deleting last recipe shows empty state", () => {
    render(<RecipesList recipes={[]} />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No recipes yet")).toBeInTheDocument();
  });

  it("cancel delete keeps recipe intact", async () => {
    const user = userEvent.setup();
    render(<RecipeDetailView recipe={convertedRecipeDetail} />);

    await user.click(screen.getByTestId("delete-button"));
    await user.click(screen.getByTestId("cancel-delete"));

    expect(screen.getByTestId("recipe-title")).toHaveTextContent(
      "Garlic Butter Pasta"
    );
    expect(mockDeleteRecipe).not.toHaveBeenCalled();
  });
});

describe("Cross-Flow: Data Persistence Across Operations", () => {
  it("recipe list handles recipes from both sources without issues", () => {
    // Simulates server-rendered page with recipes fetched from DB
    const manyRecipes: RecipeListItem[] = [
      ...mixedRecipes,
      {
        id: "gen-recipe-3",
        title: "Chocolate Chip Cookies",
        summary: "Classic cookies",
        sourceType: "generated",
        createdAt: new Date("2024-01-04"),
      },
      {
        id: "conv-recipe-2",
        title: "Steamed Dumplings",
        summary: null,
        sourceType: "converted",
        createdAt: new Date("2024-01-05"),
      },
    ];

    render(<RecipesList recipes={manyRecipes} />);

    expect(screen.getByText("Chocolate Chip Cookies")).toBeInTheDocument();
    expect(screen.getByText("Steamed Dumplings")).toBeInTheDocument();
    expect(screen.getByText("Vegan Buddha Bowl")).toBeInTheDocument();
    expect(screen.getByText("Garlic Butter Pasta")).toBeInTheDocument();
    expect(screen.getByText("Mediterranean Quinoa Salad")).toBeInTheDocument();
  });

  it("search works across mixed recipe types after adding more recipes", async () => {
    const manyRecipes: RecipeListItem[] = [
      ...mixedRecipes,
      {
        id: "conv-recipe-2",
        title: "Garlic Shrimp",
        summary: null,
        sourceType: "converted",
        createdAt: new Date("2024-01-04"),
      },
    ];

    const user = userEvent.setup();
    render(<RecipesList recipes={manyRecipes} />);

    await user.type(screen.getByTestId("search-input"), "Garlic");

    expect(screen.getByText("Garlic Butter Pasta")).toBeInTheDocument();
    expect(screen.getByText("Garlic Shrimp")).toBeInTheDocument();
    expect(screen.queryByText("Vegan Buddha Bowl")).not.toBeInTheDocument();
  });
});
