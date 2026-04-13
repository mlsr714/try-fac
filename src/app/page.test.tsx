import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Must import after mocks
import LandingPage from "./page";

describe("Landing Page", () => {
  it("renders the app name RecipeForge", () => {
    render(<LandingPage />);
    expect(screen.getByText("RecipeForge")).toBeInTheDocument();
  });

  it("renders a tagline about AI recipe generation", () => {
    render(<LandingPage />);
    expect(
      screen.getByText(/generate tailored recipes with ai/i)
    ).toBeInTheDocument();
  });

  it("renders a Get Started CTA linking to /sign-up", () => {
    render(<LandingPage />);
    const cta = screen.getByRole("link", { name: /get started/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/sign-up");
  });

  it("renders a Sign In link linking to /sign-in", () => {
    render(<LandingPage />);
    const signIn = screen.getByRole("link", { name: /sign in/i });
    expect(signIn).toBeInTheDocument();
    expect(signIn).toHaveAttribute("href", "/sign-in");
  });

  it("does not show protected content (recipe lists, dashboard widgets)", () => {
    render(<LandingPage />);
    // Should not have actual protected page content like user recipe lists,
    // pantry item lists, or dashboard quick-action cards
    expect(screen.queryByText(/my recipes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/your pantry items/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/quick actions/i)).not.toBeInTheDocument();
  });

  it("renders feature cards describing app capabilities", () => {
    render(<LandingPage />);
    expect(screen.getByText("AI Recipe Generation")).toBeInTheDocument();
    expect(screen.getByText("Thermomix Conversion")).toBeInTheDocument();
    expect(screen.getByText("Kitchen Management")).toBeInTheDocument();
  });
});
