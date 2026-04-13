import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RecipeStream } from "./recipe-stream";
import type { RecipeIdea, ConstraintFormValues } from "@/lib/schemas/generation";

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

// Mock experimental_useObject from @ai-sdk/react
const mockSubmit = vi.fn();
const mockStop = vi.fn();
const mockUseObject = vi.fn();

vi.mock("@ai-sdk/react", () => ({
  experimental_useObject: (...args: unknown[]) => mockUseObject(...args),
}));

// Mock the save recipe action
vi.mock("@/actions/save-recipe", () => ({
  saveRecipe: vi.fn().mockResolvedValue({ id: "saved-recipe-123" }),
}));

const mockIdea: RecipeIdea = {
  title: "Vegan Buddha Bowl",
  description: "A hearty plant-based bowl.",
  estimatedTime: "25 min",
  tools: ["Baking sheet"],
};

const mockConstraints: ConstraintFormValues = {
  diet: "Vegan",
  mealType: "Dinner",
  difficulty: "Easy",
  maxCookingTime: 30,
  servings: 4,
  ingredients: "",
  additionalInstructions: "",
  includePantryItems: false,
};

describe("RecipeStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmit.mockClear();
    mockStop.mockClear();
  });

  it("shows loading state before any data arrives", () => {
    mockUseObject.mockReturnValue({
      object: undefined,
      submit: mockSubmit,
      stop: mockStop,
      isLoading: true,
      error: undefined,
    });

    render(<RecipeStream idea={mockIdea} constraints={mockConstraints} />);
    expect(
      screen.getByText("Generating your recipe...")
    ).toBeInTheDocument();
  });

  it("calls submit on mount with idea and constraints", () => {
    mockUseObject.mockReturnValue({
      object: undefined,
      submit: mockSubmit,
      stop: mockStop,
      isLoading: true,
      error: undefined,
    });

    render(<RecipeStream idea={mockIdea} constraints={mockConstraints} />);

    expect(mockSubmit).toHaveBeenCalledWith({
      idea: mockIdea,
      constraints: mockConstraints,
    });
  });

  it("renders recipe content while streaming", () => {
    mockUseObject.mockReturnValue({
      object: {
        title: "Vegan Buddha Bowl",
        summary: "A hearty plant-based bowl.",
        servings: 4,
      },
      submit: mockSubmit,
      stop: mockStop,
      isLoading: true,
      error: undefined,
    });

    render(<RecipeStream idea={mockIdea} constraints={mockConstraints} />);
    expect(screen.getByText("Vegan Buddha Bowl")).toBeInTheDocument();
    expect(
      screen.getByText("A hearty plant-based bowl.")
    ).toBeInTheDocument();
    expect(screen.getByText("Generating recipe...")).toBeInTheDocument();
  });

  it("shows error state on failure", () => {
    mockUseObject.mockReturnValue({
      object: undefined,
      submit: mockSubmit,
      stop: mockStop,
      isLoading: false,
      error: new Error("Stream failed"),
    });

    render(<RecipeStream idea={mockIdea} constraints={mockConstraints} />);
    expect(
      screen.getByText("Failed to generate recipe. Please try again.")
    ).toBeInTheDocument();
  });

  it("shows save success with link after completion", async () => {
    mockUseObject.mockReturnValue({
      object: {
        title: "Vegan Buddha Bowl",
        summary: "A hearty plant-based bowl.",
        servings: 4,
        activeTime: "25 min",
        totalTime: "35 min",
        ingredients: [],
        instructions: [],
        nutrition: { calories: 450, protein: 15, carbs: 65, fat: 12 },
        tools: [],
        thermomixInstructions: null,
      },
      submit: mockSubmit,
      stop: mockStop,
      isLoading: false,
      error: undefined,
    });

    // Simulate the onFinish callback being called
    const { saveRecipe } = await import("@/actions/save-recipe");
    vi.mocked(saveRecipe).mockResolvedValue({ id: "saved-recipe-123" });

    render(<RecipeStream idea={mockIdea} constraints={mockConstraints} />);

    // The onFinish triggers auto-save
    // Get the onFinish callback from useObject call
    const useObjectCall = mockUseObject.mock.calls[0][0];
    if (useObjectCall?.onFinish) {
      await useObjectCall.onFinish({
        object: {
          title: "Vegan Buddha Bowl",
          summary: "A hearty plant-based bowl.",
          servings: 4,
          activeTime: "25 min",
          totalTime: "35 min",
          ingredients: [],
          instructions: [],
          nutrition: { calories: 450, protein: 15, carbs: 65, fat: 12 },
          tools: [],
          thermomixInstructions: null,
        },
      });
    }

    await waitFor(() => {
      expect(
        screen.getByText("Recipe saved successfully!")
      ).toBeInTheDocument();
    });

    const link = screen.getByText("View Saved Recipe").closest("a");
    expect(link).toHaveAttribute("href", "/recipes/saved-recipe-123");
  });

  it("calls stop on unmount to prevent corrupt data on navigation away", () => {
    mockUseObject.mockReturnValue({
      object: {
        title: "Vegan Buddha Bowl",
      },
      submit: mockSubmit,
      stop: mockStop,
      isLoading: true,
      error: undefined,
    });

    const { unmount } = render(
      <RecipeStream idea={mockIdea} constraints={mockConstraints} />
    );

    expect(mockStop).not.toHaveBeenCalled();
    unmount();
    expect(mockStop).toHaveBeenCalled();
  });

  it("does not save recipe when component unmounts during streaming", async () => {
    const { saveRecipe } = await import("@/actions/save-recipe");
    vi.mocked(saveRecipe).mockClear();

    mockUseObject.mockReturnValue({
      object: undefined,
      submit: mockSubmit,
      stop: mockStop,
      isLoading: true,
      error: undefined,
    });

    const { unmount } = render(
      <RecipeStream idea={mockIdea} constraints={mockConstraints} />
    );

    // Unmount before onFinish can be called
    unmount();

    // Get the onFinish callback
    const useObjectCall = mockUseObject.mock.calls[0][0];
    if (useObjectCall?.onFinish) {
      await useObjectCall.onFinish({
        object: {
          title: "Vegan Buddha Bowl",
          summary: "A hearty plant-based bowl.",
          servings: 4,
          activeTime: "25 min",
          totalTime: "35 min",
          ingredients: [],
          instructions: [],
          nutrition: { calories: 450, protein: 15, carbs: 65, fat: 12 },
          tools: [],
          thermomixInstructions: null,
        },
      });
    }

    // saveRecipe should not be called after unmount
    expect(saveRecipe).not.toHaveBeenCalled();
  });

  it("configures useObject with correct API endpoint and schema", () => {
    mockUseObject.mockReturnValue({
      object: undefined,
      submit: mockSubmit,
      stop: mockStop,
      isLoading: true,
      error: undefined,
    });

    render(<RecipeStream idea={mockIdea} constraints={mockConstraints} />);

    expect(mockUseObject).toHaveBeenCalledWith(
      expect.objectContaining({
        api: "/api/generate/recipe",
      })
    );
  });
});
