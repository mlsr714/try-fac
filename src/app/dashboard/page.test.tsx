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

// Mock @clerk/nextjs/server
vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(),
}));

// Mock the syncUser server action
vi.mock("@/actions/sync-user", () => ({
  syncUser: vi.fn().mockResolvedValue(null),
}));

import { currentUser } from "@clerk/nextjs/server";
import DashboardPage from "./page";

const mockedCurrentUser = vi.mocked(currentUser);

describe("Dashboard Page", () => {
  it("renders a greeting with the user's name when available", async () => {
    mockedCurrentUser.mockResolvedValue({
      firstName: "John",
      lastName: "Doe",
    } as Awaited<ReturnType<typeof currentUser>>);

    const Page = await DashboardPage();
    render(Page);

    expect(screen.getByText(/welcome back, john/i)).toBeInTheDocument();
  });

  it("renders a generic greeting when user name is not available", async () => {
    mockedCurrentUser.mockResolvedValue({
      firstName: null,
      lastName: null,
    } as Awaited<ReturnType<typeof currentUser>>);

    const Page = await DashboardPage();
    render(Page);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it("renders 4 quick-action cards", async () => {
    mockedCurrentUser.mockResolvedValue({
      firstName: "Jane",
      lastName: null,
    } as Awaited<ReturnType<typeof currentUser>>);

    const Page = await DashboardPage();
    render(Page);

    expect(screen.getByText("Generate Recipe")).toBeInTheDocument();
    expect(screen.getByText("Convert Recipe")).toBeInTheDocument();
    expect(screen.getByText("My Recipes")).toBeInTheDocument();
    expect(screen.getByText("My Pantry")).toBeInTheDocument();
  });

  it("each card links to the correct route", async () => {
    mockedCurrentUser.mockResolvedValue({
      firstName: "Jane",
      lastName: null,
    } as Awaited<ReturnType<typeof currentUser>>);

    const Page = await DashboardPage();
    render(Page);

    const generateLink = screen.getByRole("link", { name: /generate recipe/i });
    expect(generateLink).toHaveAttribute("href", "/generate");

    const convertLink = screen.getByRole("link", { name: /convert recipe/i });
    expect(convertLink).toHaveAttribute("href", "/convert");

    const recipesLink = screen.getByRole("link", { name: /my recipes/i });
    expect(recipesLink).toHaveAttribute("href", "/recipes");

    const pantryLink = screen.getByRole("link", { name: /my pantry/i });
    expect(pantryLink).toHaveAttribute("href", "/pantry");
  });

  it("each card has a description", async () => {
    mockedCurrentUser.mockResolvedValue({
      firstName: "Test",
      lastName: null,
    } as Awaited<ReturnType<typeof currentUser>>);

    const Page = await DashboardPage();
    render(Page);

    // Each card should have descriptive text
    expect(
      screen.getByText(/create personalized recipes/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/transform any recipe into thermomix/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/browse and manage your saved/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/manage your kitchen ingredients/i)
    ).toBeInTheDocument();
  });

  it("renders icons for each card", async () => {
    mockedCurrentUser.mockResolvedValue({
      firstName: "Test",
      lastName: null,
    } as Awaited<ReturnType<typeof currentUser>>);

    const Page = await DashboardPage();
    const { container } = render(Page);

    // Each card should contain an SVG icon (lucide-react renders as SVG)
    const svgIcons = container.querySelectorAll("svg");
    expect(svgIcons.length).toBeGreaterThanOrEqual(4);
  });

  it("calls syncUser on page load", async () => {
    const { syncUser } = await import("@/actions/sync-user");

    mockedCurrentUser.mockResolvedValue({
      firstName: "Test",
      lastName: null,
    } as Awaited<ReturnType<typeof currentUser>>);

    await DashboardPage();

    expect(syncUser).toHaveBeenCalled();
  });
});
