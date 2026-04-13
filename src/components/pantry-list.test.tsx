import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PantryList } from "./pantry-list";
import type { PantryItem } from "@/actions/get-pantry-items";

// Mock the server actions
vi.mock("@/actions/add-pantry-item", () => ({
  addPantryItem: vi.fn(),
}));
vi.mock("@/actions/update-pantry-item", () => ({
  updatePantryItem: vi.fn(),
}));
vi.mock("@/actions/delete-pantry-item", () => ({
  deletePantryItem: vi.fn(),
}));

const { addPantryItem } = await import("@/actions/add-pantry-item");
const { updatePantryItem } = await import("@/actions/update-pantry-item");
const { deletePantryItem } = await import("@/actions/delete-pantry-item");

const mockAdd = vi.mocked(addPantryItem);
const mockUpdate = vi.mocked(updatePantryItem);
const mockDelete = vi.mocked(deletePantryItem);

const mockItems: PantryItem[] = [
  { id: "item-1", name: "Butter", createdAt: new Date("2024-01-01") },
  { id: "item-2", name: "Garlic", createdAt: new Date("2024-01-02") },
  { id: "item-3", name: "Salt", createdAt: new Date("2024-01-03") },
];

describe("PantryList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Empty state ---
  it("renders empty state when no items", () => {
    render(<PantryList initialItems={[]} />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("Your pantry is empty")).toBeInTheDocument();
    expect(screen.getByTestId("add-ingredient-input")).toBeInTheDocument();
    expect(screen.getByTestId("add-ingredient-button")).toBeInTheDocument();
  });

  // --- Rendering items ---
  it("renders all pantry items", () => {
    render(<PantryList initialItems={mockItems} />);

    expect(screen.getByText("Butter")).toBeInTheDocument();
    expect(screen.getByText("Garlic")).toBeInTheDocument();
    expect(screen.getByText("Salt")).toBeInTheDocument();
  });

  it("renders add ingredient form with items", () => {
    render(<PantryList initialItems={mockItems} />);

    expect(screen.getByTestId("add-ingredient-input")).toBeInTheDocument();
    expect(screen.getByTestId("add-ingredient-button")).toBeInTheDocument();
  });

  // --- Add ingredient ---
  it("adds an ingredient and clears input", async () => {
    const user = userEvent.setup();
    mockAdd.mockResolvedValue({ item: { id: "item-new", name: "Olive Oil" } });

    render(<PantryList initialItems={mockItems} />);

    const input = screen.getByTestId("add-ingredient-input");
    await user.type(input, "Olive Oil");
    await user.click(screen.getByTestId("add-ingredient-button"));

    await waitFor(() => {
      expect(screen.getByText("Olive Oil")).toBeInTheDocument();
    });

    expect(input).toHaveValue("");
    expect(mockAdd).toHaveBeenCalledWith("Olive Oil");
  });

  it("adds ingredient with Enter key", async () => {
    const user = userEvent.setup();
    mockAdd.mockResolvedValue({ item: { id: "item-new", name: "Pepper" } });

    render(<PantryList initialItems={mockItems} />);

    const input = screen.getByTestId("add-ingredient-input");
    await user.type(input, "Pepper{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Pepper")).toBeInTheDocument();
    });

    expect(mockAdd).toHaveBeenCalledWith("Pepper");
  });

  it("shows validation error when adding empty name", async () => {
    const user = userEvent.setup();
    render(<PantryList initialItems={mockItems} />);

    await user.click(screen.getByTestId("add-ingredient-button"));

    expect(screen.getByTestId("add-error")).toBeInTheDocument();
    expect(screen.getByText("Ingredient name is required")).toBeInTheDocument();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("shows validation error when adding whitespace-only name", async () => {
    const user = userEvent.setup();
    render(<PantryList initialItems={mockItems} />);

    const input = screen.getByTestId("add-ingredient-input");
    await user.type(input, "   ");
    await user.click(screen.getByTestId("add-ingredient-button"));

    expect(screen.getByTestId("add-error")).toBeInTheDocument();
    expect(screen.getByText("Ingredient name is required")).toBeInTheDocument();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("clears add error when typing", async () => {
    const user = userEvent.setup();
    render(<PantryList initialItems={mockItems} />);

    await user.click(screen.getByTestId("add-ingredient-button"));
    expect(screen.getByTestId("add-error")).toBeInTheDocument();

    const input = screen.getByTestId("add-ingredient-input");
    await user.type(input, "A");

    expect(screen.queryByTestId("add-error")).not.toBeInTheDocument();
  });

  it("shows server error from add action", async () => {
    const user = userEvent.setup();
    mockAdd.mockResolvedValue({ error: "Failed to add ingredient" });

    render(<PantryList initialItems={mockItems} />);

    const input = screen.getByTestId("add-ingredient-input");
    await user.type(input, "Olive Oil");
    await user.click(screen.getByTestId("add-ingredient-button"));

    await waitFor(() => {
      expect(screen.getByTestId("add-error")).toBeInTheDocument();
    });
  });

  // --- Delete ingredient ---
  it("deletes an ingredient immediately", async () => {
    const user = userEvent.setup();
    mockDelete.mockResolvedValue({ success: true });

    render(<PantryList initialItems={mockItems} />);

    await user.click(screen.getByTestId("delete-button-item-2"));

    await waitFor(() => {
      expect(screen.queryByText("Garlic")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Butter")).toBeInTheDocument();
    expect(screen.getByText("Salt")).toBeInTheDocument();
    expect(mockDelete).toHaveBeenCalledWith("item-2");
  });

  it("shows empty state after deleting last item", async () => {
    const user = userEvent.setup();
    mockDelete.mockResolvedValue({ success: true });

    render(
      <PantryList
        initialItems={[{ id: "item-1", name: "Salt", createdAt: new Date() }]}
      />
    );

    await user.click(screen.getByTestId("delete-button-item-1"));

    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });
  });

  // --- Edit ingredient ---
  it("enters edit mode on click", async () => {
    const user = userEvent.setup();
    render(<PantryList initialItems={mockItems} />);

    await user.click(screen.getByTestId("edit-button-item-1"));

    expect(screen.getByTestId("edit-ingredient-input")).toBeInTheDocument();
    expect(screen.getByTestId("edit-ingredient-input")).toHaveValue("Butter");
    expect(screen.getByTestId("save-edit-button")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-edit-button")).toBeInTheDocument();
  });

  it("saves edited name", async () => {
    const user = userEvent.setup();
    mockUpdate.mockResolvedValue({
      item: { id: "item-1", name: "Unsalted Butter" },
    });

    render(<PantryList initialItems={mockItems} />);

    await user.click(screen.getByTestId("edit-button-item-1"));

    const editInput = screen.getByTestId("edit-ingredient-input");
    await user.clear(editInput);
    await user.type(editInput, "Unsalted Butter");
    await user.click(screen.getByTestId("save-edit-button"));

    await waitFor(() => {
      expect(screen.getByText("Unsalted Butter")).toBeInTheDocument();
    });

    expect(mockUpdate).toHaveBeenCalledWith("item-1", "Unsalted Butter");
    expect(
      screen.queryByTestId("edit-ingredient-input")
    ).not.toBeInTheDocument();
  });

  it("cancels edit and preserves original name", async () => {
    const user = userEvent.setup();
    render(<PantryList initialItems={mockItems} />);

    await user.click(screen.getByTestId("edit-button-item-1"));

    const editInput = screen.getByTestId("edit-ingredient-input");
    await user.clear(editInput);
    await user.type(editInput, "Something Else");
    await user.click(screen.getByTestId("cancel-edit-button"));

    expect(screen.getByText("Butter")).toBeInTheDocument();
    expect(
      screen.queryByTestId("edit-ingredient-input")
    ).not.toBeInTheDocument();
  });

  it("shows validation error when saving empty edit name", async () => {
    const user = userEvent.setup();
    render(<PantryList initialItems={mockItems} />);

    await user.click(screen.getByTestId("edit-button-item-1"));

    const editInput = screen.getByTestId("edit-ingredient-input");
    await user.clear(editInput);
    await user.click(screen.getByTestId("save-edit-button"));

    expect(screen.getByTestId("edit-error")).toBeInTheDocument();
    expect(screen.getByText("Ingredient name is required")).toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("saves edit with Enter key", async () => {
    const user = userEvent.setup();
    mockUpdate.mockResolvedValue({
      item: { id: "item-1", name: "Unsalted Butter" },
    });

    render(<PantryList initialItems={mockItems} />);

    await user.click(screen.getByTestId("edit-button-item-1"));

    const editInput = screen.getByTestId("edit-ingredient-input");
    await user.clear(editInput);
    await user.type(editInput, "Unsalted Butter{Enter}");

    await waitFor(() => {
      expect(screen.getByText("Unsalted Butter")).toBeInTheDocument();
    });
  });

  it("cancels edit with Escape key", async () => {
    const user = userEvent.setup();
    render(<PantryList initialItems={mockItems} />);

    await user.click(screen.getByTestId("edit-button-item-1"));

    expect(screen.getByTestId("edit-ingredient-input")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.getByText("Butter")).toBeInTheDocument();
    expect(
      screen.queryByTestId("edit-ingredient-input")
    ).not.toBeInTheDocument();
  });

  // --- Duplicate names ---
  it("allows adding duplicate ingredient name", async () => {
    const user = userEvent.setup();
    mockAdd.mockResolvedValue({ item: { id: "item-dup", name: "Salt" } });

    render(<PantryList initialItems={mockItems} />);

    const input = screen.getByTestId("add-ingredient-input");
    await user.type(input, "Salt");
    await user.click(screen.getByTestId("add-ingredient-button"));

    await waitFor(() => {
      const saltItems = screen.getAllByText("Salt");
      expect(saltItems.length).toBeGreaterThanOrEqual(2);
    });
  });

  // --- Many items ---
  it("renders 20+ items without issues", () => {
    const manyItems: PantryItem[] = Array.from({ length: 25 }, (_, i) => ({
      id: `item-${i}`,
      name: `Ingredient ${String(i + 1).padStart(2, "0")}`,
      createdAt: new Date(),
    }));

    render(<PantryList initialItems={manyItems} />);

    const list = screen.getByTestId("pantry-list");
    expect(list.children).toHaveLength(25);
  });

  // --- Add from empty state ---
  it("can add ingredient from empty state", async () => {
    const user = userEvent.setup();
    mockAdd.mockResolvedValue({ item: { id: "item-new", name: "Flour" } });

    render(<PantryList initialItems={[]} />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();

    const input = screen.getByTestId("add-ingredient-input");
    await user.type(input, "Flour");
    await user.click(screen.getByTestId("add-ingredient-button"));

    await waitFor(() => {
      expect(screen.getByText("Flour")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
  });
});
