import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConstraintForm } from "./constraint-form";

describe("ConstraintForm", () => {
  it("renders all constraint fields", () => {
    render(<ConstraintForm />);

    // Dropdowns
    expect(screen.getByText("Diet")).toBeInTheDocument();
    expect(screen.getByText("Meal Type")).toBeInTheDocument();
    expect(screen.getByText("Difficulty")).toBeInTheDocument();

    // Number inputs
    expect(
      screen.getByLabelText(/max active cooking time/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^servings$/i)).toBeInTheDocument();

    // Textareas
    expect(screen.getByLabelText(/ingredients/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/additional instructions/i)
    ).toBeInTheDocument();

    // Pantry toggle (switch + hidden input both get labeled)
    expect(screen.getByRole("switch")).toBeInTheDocument();
    expect(screen.getByText(/include pantry items/i)).toBeInTheDocument();

    // Submit button
    expect(
      screen.getByRole("button", { name: /generate ideas/i })
    ).toBeInTheDocument();
  });

  it("shows diet selector default value", () => {
    render(<ConstraintForm />);
    expect(screen.getByText("No Restriction")).toBeInTheDocument();
  });

  it("shows meal type selector default value", () => {
    render(<ConstraintForm />);
    expect(screen.getByText("Breakfast")).toBeInTheDocument();
  });

  it("shows difficulty selector default value", () => {
    render(<ConstraintForm />);
    expect(screen.getByText("Easy")).toBeInTheDocument();
  });

  it("rejects empty servings on submit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ConstraintForm onSubmit={onSubmit} />);

    // Fill cooking time but leave servings empty
    const cookingTimeInput = screen.getByLabelText(/max active cooking time/i);
    await user.type(cookingTimeInput, "30");

    const submitButton = screen.getByRole("button", {
      name: /generate ideas/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/servings is required/i)).toBeInTheDocument();
    });

    // onSubmit should not have been called
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects zero servings on submit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ConstraintForm onSubmit={onSubmit} />);

    const cookingTimeInput = screen.getByLabelText(/max active cooking time/i);
    await user.type(cookingTimeInput, "30");

    const servingsInput = screen.getByLabelText(/^servings$/i);
    await user.type(servingsInput, "0");

    const submitButton = screen.getByRole("button", {
      name: /generate ideas/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/servings must be at least 1/i)
      ).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects negative servings on submit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ConstraintForm onSubmit={onSubmit} />);

    const cookingTimeInput = screen.getByLabelText(/max active cooking time/i);
    await user.type(cookingTimeInput, "30");

    const servingsInput = screen.getByLabelText(/^servings$/i);
    await user.clear(servingsInput);
    await user.type(servingsInput, "-2");

    const submitButton = screen.getByRole("button", {
      name: /generate ideas/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/servings must be at least 1/i)
      ).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects empty cooking time on submit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ConstraintForm onSubmit={onSubmit} />);

    // Fill servings but leave cooking time empty
    const servingsInput = screen.getByLabelText(/^servings$/i);
    await user.type(servingsInput, "4");

    const submitButton = screen.getByRole("button", {
      name: /generate ideas/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/cooking time is required/i)
      ).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects zero cooking time on submit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ConstraintForm onSubmit={onSubmit} />);

    const cookingTimeInput = screen.getByLabelText(/max active cooking time/i);
    await user.type(cookingTimeInput, "0");

    const servingsInput = screen.getByLabelText(/^servings$/i);
    await user.type(servingsInput, "4");

    const submitButton = screen.getByRole("button", {
      name: /generate ideas/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/cooking time must be greater than 0/i)
      ).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits with valid data and calls onSubmit with constraints", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ConstraintForm onSubmit={onSubmit} />);

    const cookingTimeInput = screen.getByLabelText(/max active cooking time/i);
    await user.type(cookingTimeInput, "30");

    const servingsInput = screen.getByLabelText(/^servings$/i);
    await user.type(servingsInput, "4");

    const submitButton = screen.getByRole("button", {
      name: /generate ideas/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          diet: "No Restriction",
          mealType: "Breakfast",
          difficulty: "Easy",
          maxCookingTime: 30,
          servings: 4,
          includePantryItems: false,
        })
      );
    });
  });

  it("shows loading state when isSubmitting prop is true", () => {
    render(<ConstraintForm isSubmitting={true} />);

    // Button should show loading state
    expect(screen.getByText(/generating/i)).toBeInTheDocument();

    // Button should be disabled during loading
    const loadingButton = screen.getByRole("button");
    expect(loadingButton).toBeDisabled();
  });

  it("optional fields can be left empty on valid submit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ConstraintForm onSubmit={onSubmit} />);

    const cookingTimeInput = screen.getByLabelText(/max active cooking time/i);
    await user.type(cookingTimeInput, "30");

    const servingsInput = screen.getByLabelText(/^servings$/i);
    await user.type(servingsInput, "4");

    // Leave optional fields empty
    const submitButton = screen.getByRole("button", {
      name: /generate ideas/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    const callArgs = onSubmit.mock.calls[0][0];
    expect(callArgs.ingredients).toBe("");
    expect(callArgs.additionalInstructions).toBe("");
  });

  it("pantry toggle switches between on and off", async () => {
    const user = userEvent.setup();
    render(<ConstraintForm />);

    const toggle = screen.getByRole("switch");
    // Initially unchecked
    expect(toggle).not.toBeChecked();

    // Click to turn on
    await user.click(toggle);
    expect(toggle).toBeChecked();

    // Click to turn off
    await user.click(toggle);
    expect(toggle).not.toBeChecked();
  });

  it("double-click on submit does not send duplicate requests when isSubmitting is true", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    // Start with isSubmitting false, then the first click triggers it
    const { rerender } = render(
      <ConstraintForm onSubmit={onSubmit} isSubmitting={false} />
    );

    const cookingTimeInput = screen.getByLabelText(/max active cooking time/i);
    await user.type(cookingTimeInput, "30");

    const servingsInput = screen.getByLabelText(/^servings$/i);
    await user.type(servingsInput, "4");

    const submitButton = screen.getByRole("button", {
      name: /generate ideas/i,
    });

    // First click
    await user.click(submitButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // Simulate parent setting isSubmitting to true
    rerender(
      <ConstraintForm onSubmit={onSubmit} isSubmitting={true} />
    );

    // Second click should be prevented by disabled state
    const disabledButton = screen.getByRole("button");
    expect(disabledButton).toBeDisabled();
  });

  it("calls onSubmit callback with correct constraint values", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ConstraintForm onSubmit={onSubmit} />);

    const cookingTimeInput = screen.getByLabelText(/max active cooking time/i);
    await user.type(cookingTimeInput, "30");

    const servingsInput = screen.getByLabelText(/^servings$/i);
    await user.type(servingsInput, "4");

    const submitButton = screen.getByRole("button", {
      name: /generate ideas/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          diet: "No Restriction",
          mealType: "Breakfast",
          difficulty: "Easy",
          maxCookingTime: 30,
          servings: 4,
        })
      );
    });
  });
});
