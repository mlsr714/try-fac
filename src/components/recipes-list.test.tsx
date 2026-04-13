import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipesList } from "./recipes-list";
import type { RecipeListItem } from "@/actions/get-recipes";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockRecipes: RecipeListItem[] = [
  {
    id: "recipe-1",
    title: "Vegan Buddha Bowl",
    summary: "A hearty plant-based bowl packed with quinoa and sweet potatoes.",
    sourceType: "generated",
    createdAt: new Date("2024-01-03"),
  },
  {
    id: "recipe-2",
    title: "Mediterranean Pasta",
    summary: null,
    sourceType: "converted",
    createdAt: new Date("2024-01-02"),
  },
  {
    id: "recipe-3",
    title: "Chocolate Chip Cookies",
    summary: "Classic homemade cookies with a crispy edge.",
    sourceType: "generated",
    createdAt: new Date("2024-01-01"),
  },
];

describe("RecipesList", () => {
  it("renders empty state when no recipes", () => {
    render(<RecipesList recipes={[]} />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No recipes yet")).toBeInTheDocument();
    expect(screen.getByText("Generate Recipe")).toBeInTheDocument();
    expect(screen.getByText("Convert Recipe")).toBeInTheDocument();
  });

  it("renders all recipe cards", () => {
    render(<RecipesList recipes={mockRecipes} />);

    expect(screen.getByText("Vegan Buddha Bowl")).toBeInTheDocument();
    expect(screen.getByText("Mediterranean Pasta")).toBeInTheDocument();
    expect(screen.getByText("Chocolate Chip Cookies")).toBeInTheDocument();
  });

  it("shows source type badges", () => {
    render(<RecipesList recipes={mockRecipes} />);

    const badges = screen.getAllByText("Generated");
    expect(badges).toHaveLength(2);
    expect(screen.getByText("Converted")).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<RecipesList recipes={mockRecipes} />);

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search recipes by title...")
    ).toBeInTheDocument();
  });

  it("filters recipes by title (case-insensitive)", async () => {
    const user = userEvent.setup();
    render(<RecipesList recipes={mockRecipes} />);

    const searchInput = screen.getByTestId("search-input");
    await user.type(searchInput, "buddha");

    expect(screen.getByText("Vegan Buddha Bowl")).toBeInTheDocument();
    expect(screen.queryByText("Mediterranean Pasta")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Chocolate Chip Cookies")
    ).not.toBeInTheDocument();
  });

  it("shows no results state when search matches nothing", async () => {
    const user = userEvent.setup();
    render(<RecipesList recipes={mockRecipes} />);

    const searchInput = screen.getByTestId("search-input");
    await user.type(searchInput, "zzzzxxyy");

    expect(screen.getByTestId("no-results-state")).toBeInTheDocument();
    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("restores full list when search is cleared", async () => {
    const user = userEvent.setup();
    render(<RecipesList recipes={mockRecipes} />);

    const searchInput = screen.getByTestId("search-input");
    await user.type(searchInput, "buddha");

    expect(screen.queryByText("Mediterranean Pasta")).not.toBeInTheDocument();

    await user.clear(searchInput);

    expect(screen.getByText("Vegan Buddha Bowl")).toBeInTheDocument();
    expect(screen.getByText("Mediterranean Pasta")).toBeInTheDocument();
    expect(screen.getByText("Chocolate Chip Cookies")).toBeInTheDocument();
  });

  it("links recipe cards to detail pages", () => {
    render(<RecipesList recipes={mockRecipes} />);

    const links = screen.getAllByRole("link");
    // Filter to recipe links (not the generate/convert links)
    const recipeLinks = links.filter((link) =>
      link.getAttribute("href")?.startsWith("/recipes/")
    );
    expect(recipeLinks).toHaveLength(3);
    expect(recipeLinks[0]).toHaveAttribute("href", "/recipes/recipe-1");
    expect(recipeLinks[1]).toHaveAttribute("href", "/recipes/recipe-2");
    expect(recipeLinks[2]).toHaveAttribute("href", "/recipes/recipe-3");
  });

  it("shows recipe summary when available", () => {
    render(<RecipesList recipes={mockRecipes} />);

    expect(
      screen.getByText(
        "A hearty plant-based bowl packed with quinoa and sweet potatoes."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Classic homemade cookies with a crispy edge.")
    ).toBeInTheDocument();
  });

  it("does not show search input when no recipes", () => {
    render(<RecipesList recipes={[]} />);

    expect(screen.queryByTestId("search-input")).not.toBeInTheDocument();
  });

  it("empty state has links to generate and convert pages", () => {
    render(<RecipesList recipes={[]} />);

    const generateLink = screen.getByText("Generate Recipe").closest("a");
    const convertLink = screen.getByText("Convert Recipe").closest("a");
    expect(generateLink).toHaveAttribute("href", "/generate");
    expect(convertLink).toHaveAttribute("href", "/convert");
  });
});
