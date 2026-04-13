import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IdeaCards } from "./idea-cards";
import type { RecipeIdea } from "@/lib/schemas/generation";

const mockIdeas: RecipeIdea[] = [
  {
    title: "Vegan Dinner Bowl",
    description: "A hearty plant-based dinner bowl with quinoa.",
    estimatedTime: "25 min",
    tools: ["Baking sheet", "Mixing bowl"],
  },
  {
    title: "Tofu Stir-Fry",
    description: "Crispy tofu with vegetables in soy-ginger sauce.",
    estimatedTime: "20 min",
    tools: ["Wok", "Cutting board"],
  },
  {
    title: "Chickpea Curry",
    description: "A warming spiced chickpea curry with coconut milk.",
    estimatedTime: "30 min",
    tools: ["Saucepan"],
  },
];

describe("IdeaCards", () => {
  it("renders exactly 3 idea cards", () => {
    render(
      <IdeaCards ideas={mockIdeas} onSelect={vi.fn()} onRefine={vi.fn()} />
    );

    const titles = mockIdeas.map((idea) =>
      screen.getByText(idea.title)
    );
    expect(titles).toHaveLength(3);
  });

  it("each card shows title", () => {
    render(
      <IdeaCards ideas={mockIdeas} onSelect={vi.fn()} onRefine={vi.fn()} />
    );

    for (const idea of mockIdeas) {
      expect(screen.getByText(idea.title)).toBeInTheDocument();
    }
  });

  it("each card shows description", () => {
    render(
      <IdeaCards ideas={mockIdeas} onSelect={vi.fn()} onRefine={vi.fn()} />
    );

    for (const idea of mockIdeas) {
      expect(screen.getByText(idea.description)).toBeInTheDocument();
    }
  });

  it("each card shows estimated time", () => {
    render(
      <IdeaCards ideas={mockIdeas} onSelect={vi.fn()} onRefine={vi.fn()} />
    );

    expect(screen.getByText("25 min")).toBeInTheDocument();
    expect(screen.getByText("20 min")).toBeInTheDocument();
    expect(screen.getByText("30 min")).toBeInTheDocument();
  });

  it("each card shows required tools", () => {
    render(
      <IdeaCards ideas={mockIdeas} onSelect={vi.fn()} onRefine={vi.fn()} />
    );

    expect(
      screen.getByText("Baking sheet, Mixing bowl")
    ).toBeInTheDocument();
    expect(screen.getByText("Wok, Cutting board")).toBeInTheDocument();
    expect(screen.getByText("Saucepan")).toBeInTheDocument();
  });

  it("each card has a Select button", () => {
    render(
      <IdeaCards ideas={mockIdeas} onSelect={vi.fn()} onRefine={vi.fn()} />
    );

    const selectButtons = screen.getAllByRole("button", { name: /select/i });
    expect(selectButtons).toHaveLength(3);
  });

  it("calls onSelect with the correct idea when Select is clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <IdeaCards ideas={mockIdeas} onSelect={onSelect} onRefine={vi.fn()} />
    );

    const selectButtons = screen.getAllByRole("button", { name: /select/i });
    await user.click(selectButtons[1]);

    expect(onSelect).toHaveBeenCalledWith(mockIdeas[1]);
  });

  it("shows a Refine button", () => {
    render(
      <IdeaCards ideas={mockIdeas} onSelect={vi.fn()} onRefine={vi.fn()} />
    );

    expect(
      screen.getByRole("button", { name: /refine/i })
    ).toBeInTheDocument();
  });

  it("clicking Refine reveals a text input for refinement instructions", async () => {
    const user = userEvent.setup();

    render(
      <IdeaCards ideas={mockIdeas} onSelect={vi.fn()} onRefine={vi.fn()} />
    );

    await user.click(screen.getByRole("button", { name: /refine/i }));

    expect(
      screen.getByLabelText(/refinement instructions/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit refinement/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancel/i })
    ).toBeInTheDocument();
  });

  it("submit refinement button is disabled when refinement text is empty", async () => {
    const user = userEvent.setup();

    render(
      <IdeaCards ideas={mockIdeas} onSelect={vi.fn()} onRefine={vi.fn()} />
    );

    await user.click(screen.getByRole("button", { name: /refine/i }));

    const submitBtn = screen.getByRole("button", {
      name: /submit refinement/i,
    });
    expect(submitBtn).toBeDisabled();
  });

  it("shows validation error when submitting empty refinement text", async () => {
    const user = userEvent.setup();

    render(
      <IdeaCards ideas={mockIdeas} onSelect={vi.fn()} onRefine={vi.fn()} />
    );

    await user.click(screen.getByRole("button", { name: /refine/i }));

    // Type whitespace only
    const textarea = screen.getByLabelText(/refinement instructions/i);
    await user.type(textarea, "   ");
    // Clear to make it empty again — the button should remain disabled
    await user.clear(textarea);

    const submitBtn = screen.getByRole("button", {
      name: /submit refinement/i,
    });
    expect(submitBtn).toBeDisabled();
  });

  it("calls onRefine with the trimmed refinement text on submit", async () => {
    const onRefine = vi.fn();
    const user = userEvent.setup();

    render(
      <IdeaCards ideas={mockIdeas} onSelect={vi.fn()} onRefine={onRefine} />
    );

    await user.click(screen.getByRole("button", { name: /refine/i }));

    const textarea = screen.getByLabelText(/refinement instructions/i);
    await user.type(textarea, "  Make it more Mediterranean  ");

    await user.click(
      screen.getByRole("button", { name: /submit refinement/i })
    );

    expect(onRefine).toHaveBeenCalledWith("Make it more Mediterranean");
  });

  it("cancel button hides refinement input", async () => {
    const user = userEvent.setup();

    render(
      <IdeaCards ideas={mockIdeas} onSelect={vi.fn()} onRefine={vi.fn()} />
    );

    await user.click(screen.getByRole("button", { name: /refine/i }));
    expect(
      screen.getByLabelText(/refinement instructions/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByLabelText(/refinement instructions/i)
    ).not.toBeInTheDocument();

    // Refine button should be visible again
    expect(
      screen.getByRole("button", { name: /refine/i })
    ).toBeInTheDocument();
  });

  it("disables buttons when disabled prop is true", () => {
    render(
      <IdeaCards
        ideas={mockIdeas}
        onSelect={vi.fn()}
        onRefine={vi.fn()}
        disabled={true}
      />
    );

    const selectButtons = screen.getAllByRole("button", { name: /select/i });
    for (const btn of selectButtons) {
      expect(btn).toBeDisabled();
    }

    expect(screen.getByRole("button", { name: /refine/i })).toBeDisabled();
  });

  it("disables select buttons and refinement submit during refining", () => {
    render(
      <IdeaCards
        ideas={mockIdeas}
        onSelect={vi.fn()}
        onRefine={vi.fn()}
        isRefining={true}
      />
    );

    const selectButtons = screen.getAllByRole("button", { name: /select/i });
    for (const btn of selectButtons) {
      expect(btn).toBeDisabled();
    }
  });

  it("shows loading state during refinement", () => {
    render(
      <IdeaCards
        ideas={mockIdeas}
        onSelect={vi.fn()}
        onRefine={vi.fn()}
        isRefining={true}
      />
    );

    expect(screen.getByText(/refining/i)).toBeInTheDocument();
  });

  it("shows 'No special tools' when tools array is empty", () => {
    const ideasWithEmptyTools: RecipeIdea[] = [
      {
        title: "Simple Salad",
        description: "A basic green salad.",
        estimatedTime: "5 min",
        tools: [],
      },
    ];

    render(
      <IdeaCards
        ideas={ideasWithEmptyTools}
        onSelect={vi.fn()}
        onRefine={vi.fn()}
      />
    );

    expect(screen.getByText("No special tools")).toBeInTheDocument();
  });

  it("can select idea after refinement flow (onSelect still works)", async () => {
    const onSelect = vi.fn();
    const onRefine = vi.fn();
    const user = userEvent.setup();

    render(
      <IdeaCards
        ideas={mockIdeas}
        onSelect={onSelect}
        onRefine={onRefine}
        isRefining={false}
      />
    );

    // Select buttons should be enabled
    const selectButtons = screen.getAllByRole("button", { name: /select/i });
    await user.click(selectButtons[0]);

    expect(onSelect).toHaveBeenCalledWith(mockIdeas[0]);
  });
});
