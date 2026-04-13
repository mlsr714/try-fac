import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConstraintForm } from "./constraint-form";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

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
    const user = userEvent.setup();
    render(<ConstraintForm />);

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

    // Fetch should not have been called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects zero servings on submit", async () => {
    const user = userEvent.setup();
    render(<ConstraintForm />);

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

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects negative servings on submit", async () => {
    const user = userEvent.setup();
    render(<ConstraintForm />);

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

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects empty cooking time on submit", async () => {
    const user = userEvent.setup();
    render(<ConstraintForm />);

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

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects zero cooking time on submit", async () => {
    const user = userEvent.setup();
    render(<ConstraintForm />);

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

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("submits with valid data and shows loading state", async () => {
    const mockResponse = {
      ideas: [
        {
          title: "Test Recipe 1",
          description: "Description 1",
          estimatedTime: "30 min",
          tools: ["Bowl"],
        },
        {
          title: "Test Recipe 2",
          description: "Description 2",
          estimatedTime: "20 min",
          tools: ["Pan"],
        },
        {
          title: "Test Recipe 3",
          description: "Description 3",
          estimatedTime: "25 min",
          tools: ["Knife"],
        },
      ],
    };

    // Make fetch return after a delay so we can check loading state
    let resolveResponse!: (value: unknown) => void;
    const responsePromise = new Promise((resolve) => {
      resolveResponse = resolve;
    });

    mockFetch.mockReturnValue(responsePromise);

    const user = userEvent.setup();
    render(<ConstraintForm />);

    const cookingTimeInput = screen.getByLabelText(/max active cooking time/i);
    await user.type(cookingTimeInput, "30");

    const servingsInput = screen.getByLabelText(/^servings$/i);
    await user.type(servingsInput, "4");

    const submitButton = screen.getByRole("button", {
      name: /generate ideas/i,
    });
    await user.click(submitButton);

    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByText(/generating/i)).toBeInTheDocument();
    });

    // Button should be disabled during loading
    const loadingButton = screen.getByRole("button");
    expect(loadingButton).toBeDisabled();

    // Resolve the fetch
    resolveResponse({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /generate ideas/i })
      ).toBeEnabled();
    });

    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith("/api/generate/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: expect.any(String),
    });

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody).toMatchObject({
      diet: "No Restriction",
      mealType: "Breakfast",
      difficulty: "Easy",
      maxCookingTime: 30,
      servings: 4,
      includePantryItems: false,
    });
  });

  it("optional fields can be left empty on valid submit", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ideas: [
            {
              title: "T1",
              description: "D1",
              estimatedTime: "10 min",
              tools: [],
            },
            {
              title: "T2",
              description: "D2",
              estimatedTime: "15 min",
              tools: [],
            },
            {
              title: "T3",
              description: "D3",
              estimatedTime: "20 min",
              tools: [],
            },
          ],
        }),
    });

    const user = userEvent.setup();
    render(<ConstraintForm />);

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
      expect(mockFetch).toHaveBeenCalled();
    });

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.ingredients).toBe("");
    expect(callBody.additionalInstructions).toBe("");
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

  it("double-click on submit does not send duplicate requests", async () => {
    let resolveResponse!: (value: unknown) => void;
    const responsePromise = new Promise((resolve) => {
      resolveResponse = resolve;
    });
    mockFetch.mockReturnValue(responsePromise);

    const user = userEvent.setup();
    render(<ConstraintForm />);

    const cookingTimeInput = screen.getByLabelText(/max active cooking time/i);
    await user.type(cookingTimeInput, "30");

    const servingsInput = screen.getByLabelText(/^servings$/i);
    await user.type(servingsInput, "4");

    const submitButton = screen.getByRole("button", {
      name: /generate ideas/i,
    });

    // Double-click
    await user.click(submitButton);
    await user.click(submitButton);

    // Should only have been called once
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Clean up
    resolveResponse({
      ok: true,
      json: () => Promise.resolve({ ideas: [] }),
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /generate ideas/i })
      ).toBeEnabled();
    });
  });

  it("calls onSuccess callback with response data", async () => {
    const mockData = {
      ideas: [
        {
          title: "T1",
          description: "D1",
          estimatedTime: "10 min",
          tools: [],
        },
        {
          title: "T2",
          description: "D2",
          estimatedTime: "15 min",
          tools: [],
        },
        {
          title: "T3",
          description: "D3",
          estimatedTime: "20 min",
          tools: [],
        },
      ],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(<ConstraintForm onSuccess={onSuccess} />);

    const cookingTimeInput = screen.getByLabelText(/max active cooking time/i);
    await user.type(cookingTimeInput, "30");

    const servingsInput = screen.getByLabelText(/^servings$/i);
    await user.type(servingsInput, "4");

    const submitButton = screen.getByRole("button", {
      name: /generate ideas/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockData);
    });
  });
});
