import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RecipeNotFound from "./not-found";

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

describe("RecipeNotFound", () => {
  it("renders 404 page with appropriate message", () => {
    render(<RecipeNotFound />);

    expect(screen.getByText("Recipe Not Found")).toBeInTheDocument();
    expect(
      screen.getByText(/this recipe may have been deleted/i)
    ).toBeInTheDocument();
  });

  it("provides link back to recipes list", () => {
    render(<RecipeNotFound />);

    const link = screen.getByRole("link", { name: /back to recipes/i });
    expect(link).toHaveAttribute("href", "/recipes");
  });
});
