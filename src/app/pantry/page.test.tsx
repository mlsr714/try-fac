import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/get-pantry-items", () => ({
  getPantryItems: vi.fn(),
}));

vi.mock("@/components/pantry-list", () => ({
  PantryList: ({
    initialItems,
  }: {
    initialItems: Array<{ id: string; name: string }>;
  }) => (
    <div data-testid="pantry-list">
      {initialItems.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  ),
}));

const { getPantryItems } = await import("@/actions/get-pantry-items");
const mockGetPantryItems = vi.mocked(getPantryItems);

import PantryPage from "./page";

describe("PantryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it("renders the same pantry items after repeated page refreshes", async () => {
    const persistedItems = [
      { id: "item-1", name: "Garlic", createdAt: new Date("2024-01-01") },
      { id: "item-2", name: "Rice", createdAt: new Date("2024-01-02") },
      { id: "item-3", name: "Chicken", createdAt: new Date("2024-01-03") },
    ];

    mockGetPantryItems.mockResolvedValue({ items: persistedItems });

    const firstRender = await PantryPage();
    render(firstRender);

    expect(screen.getByText("My Pantry")).toBeInTheDocument();
    expect(screen.getByText("Garlic")).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
    expect(screen.getByText("Chicken")).toBeInTheDocument();

    cleanup();

    const secondRender = await PantryPage();
    render(secondRender);

    expect(screen.getByText("Garlic")).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
    expect(screen.getByText("Chicken")).toBeInTheDocument();
    expect(mockGetPantryItems).toHaveBeenCalledTimes(2);
  });

  it("renders an error message when pantry loading fails", async () => {
    mockGetPantryItems.mockResolvedValue({ error: "Failed to fetch pantry items" });

    const page = await PantryPage();
    render(page);

    expect(screen.getByText("My Pantry")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch pantry items")).toBeInTheDocument();
  });
});
