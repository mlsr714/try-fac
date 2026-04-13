import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

// Mock the AI SDK
const mockToTextStreamResponse = vi.fn();
const mockStreamText = vi.fn();

vi.mock("ai", () => ({
  streamText: (...args: unknown[]) => mockStreamText(...args),
  Output: {
    object: vi.fn((opts: unknown) => opts),
  },
  gateway: vi.fn((model: string) => model),
}));

const validRequest = {
  idea: {
    title: "Vegan Buddha Bowl",
    description: "A hearty plant-based bowl with roasted vegetables and quinoa.",
    estimatedTime: "25 min",
    tools: ["Baking sheet", "Mixing bowl"],
  },
  constraints: {
    diet: "Vegan" as const,
    mealType: "Dinner" as const,
    difficulty: "Easy" as const,
    maxCookingTime: 30,
    servings: 4,
    ingredients: "quinoa, sweet potato",
    additionalInstructions: "Make it colorful",
    includePantryItems: false,
  },
};

function createRequest(body: unknown) {
  return new Request("http://localhost:3100/api/generate/recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/generate/recipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToTextStreamResponse.mockReturnValue(
      new Response("streaming content", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
    mockStreamText.mockReturnValue({
      toTextStreamResponse: mockToTextStreamResponse,
    });
  });

  it("returns a streaming response for valid input", async () => {
    const request = createRequest(validRequest);
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");
  });

  it("calls streamText with correct model and output schema", async () => {
    const request = createRequest(validRequest);
    await POST(request);

    expect(mockStreamText).toHaveBeenCalledTimes(1);
    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.prompt).toContain("Vegan Buddha Bowl");
    expect(callArgs.prompt).toContain("Vegan");
    expect(callArgs.prompt).toContain("Dinner");
    expect(callArgs.prompt).toContain("Easy");
    expect(callArgs.prompt).toContain("30");
    expect(callArgs.prompt).toContain("4");
    expect(callArgs.prompt).toContain("quinoa, sweet potato");
    expect(callArgs.prompt).toContain("Make it colorful");
    expect(callArgs.output).toBeDefined();
  });

  it("returns 400 for missing idea", async () => {
    const request = createRequest({
      constraints: validRequest.constraints,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Invalid request");
  });

  it("returns 400 for missing constraints", async () => {
    const request = createRequest({
      idea: validRequest.idea,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Invalid request");
  });

  it("returns 400 for invalid constraints (zero servings)", async () => {
    const request = createRequest({
      idea: validRequest.idea,
      constraints: {
        ...validRequest.constraints,
        servings: 0,
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("includes idea details in prompt", async () => {
    const request = createRequest(validRequest);
    await POST(request);

    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.prompt).toContain("Vegan Buddha Bowl");
    expect(callArgs.prompt).toContain(
      "A hearty plant-based bowl with roasted vegetables and quinoa."
    );
    expect(callArgs.prompt).toContain("25 min");
    expect(callArgs.prompt).toContain("Baking sheet");
  });

  it("includes diet and time constraints in prompt", async () => {
    const request = createRequest({
      idea: validRequest.idea,
      constraints: {
        ...validRequest.constraints,
        diet: "Keto",
        maxCookingTime: 45,
      },
    });
    await POST(request);

    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.prompt).toContain("Keto");
    expect(callArgs.prompt).toContain("45");
    expect(callArgs.prompt).toContain("MUST NOT exceed");
  });

  it("includes Thermomix instruction in prompt", async () => {
    const request = createRequest(validRequest);
    await POST(request);

    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.prompt).toContain("Thermomix");
  });

  it("omits optional fields from prompt when empty", async () => {
    const request = createRequest({
      idea: validRequest.idea,
      constraints: {
        diet: "No Restriction",
        mealType: "Breakfast",
        difficulty: "Easy",
        maxCookingTime: 15,
        servings: 1,
        ingredients: "",
        additionalInstructions: "",
        includePantryItems: false,
      },
    });
    await POST(request);

    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.prompt).not.toContain("Available Ingredients:");
    expect(callArgs.prompt).not.toContain("Additional Instructions:");
  });

  it("returns 500 when streamText throws", async () => {
    mockStreamText.mockImplementation(() => {
      throw new Error("AI error");
    });

    const request = createRequest(validRequest);
    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe("Failed to generate recipe");
  });
});
