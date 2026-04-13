import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConvertPage from "./page";

// Store the useObject config to invoke callbacks in tests
let useObjectConfig: {
  api: string;
  schema: unknown;
  onFinish?: (args: { object: unknown }) => void;
  onError?: (error: unknown) => void;
};

const mockSubmit = vi.fn();
const mockStop = vi.fn();
let mockIsLoading = false;
let mockObject: unknown = null;
let mockError: unknown = null;

vi.mock("@ai-sdk/react", () => ({
  experimental_useObject: (config: typeof useObjectConfig) => {
    useObjectConfig = config;
    return {
      object: mockObject,
      submit: mockSubmit,
      stop: mockStop,
      isLoading: mockIsLoading,
      error: mockError,
    };
  },
}));

// Mock the save action
vi.mock("@/actions/save-converted-recipe", () => ({
  saveConvertedRecipe: vi.fn(),
}));

describe("ConvertPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading = false;
    mockObject = null;
    mockError = null;
  });

  it("renders the heading 'Convert a Recipe'", () => {
    render(<ConvertPage />);
    expect(screen.getByText("Convert a Recipe")).toBeDefined();
  });

  it("renders a textarea with placeholder text", () => {
    render(<ConvertPage />);
    const textarea = screen.getByPlaceholderText("Paste your recipe here...");
    expect(textarea).toBeDefined();
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("renders a Convert button", () => {
    render(<ConvertPage />);
    const button = screen.getByTestId("convert-button");
    expect(button).toBeDefined();
    expect(button.textContent).toContain("Convert");
  });

  it("Convert button is disabled when textarea is empty", () => {
    render(<ConvertPage />);
    const button = screen.getByTestId("convert-button");
    expect(button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true").toBe(true);
  });

  it("Convert button is disabled when textarea contains only whitespace", async () => {
    const user = userEvent.setup();
    render(<ConvertPage />);
    const textarea = screen.getByPlaceholderText("Paste your recipe here...");
    await user.type(textarea, "   \n\t  ");
    const button = screen.getByTestId("convert-button");
    expect(button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true").toBe(true);
  });

  it("Convert button is enabled when text is entered", async () => {
    const user = userEvent.setup();
    render(<ConvertPage />);
    const textarea = screen.getByPlaceholderText("Paste your recipe here...");
    await user.type(textarea, "Some recipe text");
    const button = screen.getByTestId("convert-button");
    expect(button.hasAttribute("disabled")).toBe(false);
  });

  it("calls submit with trimmed recipe text on Convert click", async () => {
    const user = userEvent.setup();
    render(<ConvertPage />);
    const textarea = screen.getByPlaceholderText("Paste your recipe here...");
    await user.type(textarea, "  Recipe text  ");
    const button = screen.getByTestId("convert-button");
    await user.click(button);
    expect(mockSubmit).toHaveBeenCalledWith({ recipeText: "Recipe text" });
  });

  it("configures useObject with correct API endpoint", () => {
    render(<ConvertPage />);
    expect(useObjectConfig.api).toBe("/api/convert");
  });

  it("Convert button shows loading state during processing", () => {
    mockIsLoading = true;
    render(<ConvertPage />);
    const button = screen.getByTestId("convert-button");
    expect(button.textContent).toContain("Converting...");
  });

  it("Convert button is disabled during processing", () => {
    mockIsLoading = true;
    render(<ConvertPage />);
    const button = screen.getByTestId("convert-button");
    expect(button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true").toBe(true);
  });

  it("does not show Save button before conversion", () => {
    render(<ConvertPage />);
    expect(screen.queryByTestId("save-button")).toBeNull();
  });

  it("does not show Save button during streaming", () => {
    mockIsLoading = true;
    mockObject = { title: "Test Recipe" };
    render(<ConvertPage />);
    expect(screen.queryByTestId("save-button")).toBeNull();
  });

  it("shows error state on conversion failure", () => {
    mockError = new Error("AI error");
    render(<ConvertPage />);
    expect(
      screen.getByText("Failed to convert recipe. Please try again.")
    ).toBeDefined();
  });

  it("textarea preserves input after conversion starts", async () => {
    const user = userEvent.setup();
    render(<ConvertPage />);
    const textarea = screen.getByPlaceholderText(
      "Paste your recipe here..."
    ) as HTMLTextAreaElement;
    await user.type(textarea, "My recipe text");
    await user.click(screen.getByTestId("convert-button"));
    expect(textarea.value).toBe("My recipe text");
  });

  it("renders converted recipe content when object is available", () => {
    mockObject = {
      title: "Test Recipe",
      ingredients: [{ name: "Flour", amount: "200", unit: "g" }],
      steps: [{ step: 1, text: "Mix everything." }],
      thermomixInstructions: [],
      warnings: null,
    };
    render(<ConvertPage />);
    expect(screen.getByText("Test Recipe")).toBeDefined();
  });
});
