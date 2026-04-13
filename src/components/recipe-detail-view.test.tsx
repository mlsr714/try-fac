import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipeDetailView } from "./recipe-detail-view";
import type { RecipeDetail } from "@/actions/get-recipe";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

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

// Mock delete-recipe action
vi.mock("@/actions/delete-recipe", () => ({
  deleteRecipe: vi.fn(),
}));

const { deleteRecipe } = await import("@/actions/delete-recipe");
const mockDeleteRecipe = vi.mocked(deleteRecipe);

const fullRecipe: RecipeDetail = {
  id: "recipe-uuid-123",
  title: "Vegan Buddha Bowl",
  summary: "A hearty plant-based bowl packed with quinoa and sweet potatoes.",
  servings: 4,
  activeTime: "25 min",
  totalTime: "35 min",
  ingredients: [
    { name: "Quinoa", amount: "1", unit: "cup" },
    { name: "Sweet Potato", amount: "2", unit: "medium" },
    { name: "Chickpeas", amount: "1", unit: "can" },
  ],
  instructions: [
    { step: 1, text: "Cook quinoa according to package instructions." },
    { step: 2, text: "Roast sweet potatoes at 400°F for 25 minutes." },
    { step: 3, text: "Combine all ingredients in a bowl." },
  ],
  nutrition: {
    calories: 450,
    protein: 15,
    carbs: 65,
    fat: 12,
  },
  tools: ["Baking sheet", "Saucepan", "Mixing bowl"],
  thermomixInstructions: null,
  sourceType: "generated",
  createdAt: new Date("2024-01-01"),
};

const recipeWithThermomix: RecipeDetail = {
  ...fullRecipe,
  thermomixInstructions: [
    {
      step: 1,
      text: "Blend the quinoa",
      speed: "Speed 7",
      temperature: "100°C",
      time: "10 min",
      bowl: "Main bowl",
    },
    {
      step: 2,
      text: "Steam sweet potatoes",
      speed: "Speed 1",
      temperature: "Varoma",
      time: "20 min",
      bowl: "Varoma tray",
      accessories: "Steaming basket",
    },
  ],
};

describe("RecipeDetailView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders recipe title", () => {
    render(<RecipeDetailView recipe={fullRecipe} />);
    expect(screen.getByTestId("recipe-title")).toHaveTextContent(
      "Vegan Buddha Bowl"
    );
  });

  it("renders recipe summary", () => {
    render(<RecipeDetailView recipe={fullRecipe} />);
    expect(screen.getByTestId("recipe-summary")).toHaveTextContent(
      "A hearty plant-based bowl"
    );
  });

  it("renders servings, active time, and total time", () => {
    render(<RecipeDetailView recipe={fullRecipe} />);
    const meta = screen.getByTestId("recipe-meta");
    expect(meta).toHaveTextContent("4 servings");
    expect(meta).toHaveTextContent("Active: 25 min");
    expect(meta).toHaveTextContent("Total: 35 min");
  });

  it("renders ingredients list", () => {
    render(<RecipeDetailView recipe={fullRecipe} />);
    const list = screen.getByTestId("ingredients-list");
    expect(list.children).toHaveLength(3);
    expect(list).toHaveTextContent("Quinoa");
    expect(list).toHaveTextContent("Sweet Potato");
    expect(list).toHaveTextContent("Chickpeas");
  });

  it("renders numbered instructions", () => {
    render(<RecipeDetailView recipe={fullRecipe} />);
    const list = screen.getByTestId("instructions-list");
    expect(list.children).toHaveLength(3);
    expect(list).toHaveTextContent("Cook quinoa");
    expect(list).toHaveTextContent("Roast sweet potatoes");
  });

  it("renders nutrition info", () => {
    render(<RecipeDetailView recipe={fullRecipe} />);
    const nutrition = screen.getByTestId("nutrition-info");
    expect(nutrition).toHaveTextContent("450");
    expect(nutrition).toHaveTextContent("15g");
    expect(nutrition).toHaveTextContent("65g");
    expect(nutrition).toHaveTextContent("12g");
  });

  it("renders tools", () => {
    render(<RecipeDetailView recipe={fullRecipe} />);
    const tools = screen.getByTestId("tools-list");
    expect(tools).toHaveTextContent("Baking sheet");
    expect(tools).toHaveTextContent("Saucepan");
    expect(tools).toHaveTextContent("Mixing bowl");
  });

  it("does NOT render Thermomix section when null", () => {
    render(<RecipeDetailView recipe={fullRecipe} />);
    expect(
      screen.queryByTestId("thermomix-instructions")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Thermomix Instructions")
    ).not.toBeInTheDocument();
  });

  it("renders Thermomix instructions when present", () => {
    render(<RecipeDetailView recipe={recipeWithThermomix} />);
    const tmix = screen.getByTestId("thermomix-instructions");
    expect(tmix).toBeInTheDocument();
    expect(tmix).toHaveTextContent("Blend the quinoa");
    expect(tmix).toHaveTextContent("Speed 7");
    expect(tmix).toHaveTextContent("100°C");
    expect(tmix).toHaveTextContent("10 min");
    expect(tmix).toHaveTextContent("Main bowl");
    expect(tmix).toHaveTextContent("Steam sweet potatoes");
    expect(tmix).toHaveTextContent("Varoma");
  });

  it("renders back link to /recipes", () => {
    render(<RecipeDetailView recipe={fullRecipe} />);
    const backLink = screen.getByTestId("back-link");
    expect(backLink).toHaveAttribute("href", "/recipes");
    expect(backLink).toHaveTextContent("Back to Recipes");
  });

  it("renders delete button", () => {
    render(<RecipeDetailView recipe={fullRecipe} />);
    expect(screen.getByTestId("delete-button")).toBeInTheDocument();
  });

  it("delete confirmation dialog shows on delete click", async () => {
    const user = userEvent.setup();
    render(<RecipeDetailView recipe={fullRecipe} />);

    await user.click(screen.getByTestId("delete-button"));

    expect(screen.getByText("Delete Recipe")).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to delete/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("cancel-delete")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-delete")).toBeInTheDocument();
  });

  it("cancel delete keeps recipe intact", async () => {
    const user = userEvent.setup();
    render(<RecipeDetailView recipe={fullRecipe} />);

    await user.click(screen.getByTestId("delete-button"));
    await user.click(screen.getByTestId("cancel-delete"));

    // Recipe should still be displayed
    expect(screen.getByTestId("recipe-title")).toHaveTextContent(
      "Vegan Buddha Bowl"
    );
    expect(mockDeleteRecipe).not.toHaveBeenCalled();
  });

  it("confirm delete calls deleteRecipe and redirects", async () => {
    const user = userEvent.setup();
    mockDeleteRecipe.mockResolvedValue({ success: true });
    render(<RecipeDetailView recipe={fullRecipe} />);

    await user.click(screen.getByTestId("delete-button"));
    await user.click(screen.getByTestId("confirm-delete"));

    expect(mockDeleteRecipe).toHaveBeenCalledWith("recipe-uuid-123");
    expect(mockPush).toHaveBeenCalledWith("/recipes");
  });

  it("handles recipe without optional fields", () => {
    const minimalRecipe: RecipeDetail = {
      id: "recipe-2",
      title: "Simple Recipe",
      summary: null,
      servings: null,
      activeTime: null,
      totalTime: null,
      ingredients: [{ name: "Flour", amount: "2", unit: "cups" }],
      instructions: [{ step: 1, text: "Mix ingredients." }],
      nutrition: null,
      tools: null,
      thermomixInstructions: null,
      sourceType: "converted",
      createdAt: new Date("2024-01-01"),
    };

    render(<RecipeDetailView recipe={minimalRecipe} />);
    expect(screen.getByTestId("recipe-title")).toHaveTextContent(
      "Simple Recipe"
    );
    expect(screen.queryByTestId("recipe-summary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("recipe-meta")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nutrition-info")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tools-list")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("thermomix-instructions")
    ).not.toBeInTheDocument();
  });
});
