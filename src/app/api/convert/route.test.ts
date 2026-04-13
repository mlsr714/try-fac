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
  recipeText:
    "Garlic Butter Pasta: 200g spaghetti, 3 cloves garlic, 50g butter. Boil pasta. Sauté garlic in butter, toss with pasta.",
};

function createRequest(body: unknown) {
  return new Request("http://localhost:3100/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/convert", () => {
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

  it("returns a streaming response for valid recipe text", async () => {
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
    expect(callArgs.model).toBe("openai/gpt-4o");
    expect(callArgs.output).toBeDefined();
    expect(callArgs.prompt).toContain("Garlic Butter Pasta");
    expect(callArgs.prompt).toContain("spaghetti");
  });

  it("returns 400 for missing recipeText", async () => {
    const request = createRequest({});
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid request");
  });

  it("returns 400 for empty recipeText", async () => {
    const request = createRequest({ recipeText: "" });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid request");
  });

  it("includes Thermomix instructions in prompt", async () => {
    const request = createRequest(validRequest);
    await POST(request);

    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.prompt).toContain("Thermomix");
    expect(callArgs.prompt).toContain("Speed");
    expect(callArgs.prompt).toContain("temperature");
    expect(callArgs.prompt).toContain("Varoma");
  });

  it("includes warning instructions in prompt", async () => {
    const request = createRequest(validRequest);
    await POST(request);

    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.prompt).toContain("Warnings");
    expect(callArgs.prompt).toContain("assumptions");
  });

  it("includes special character handling instructions in prompt", async () => {
    const request = createRequest(validRequest);
    await POST(request);

    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.prompt).toContain("special characters");
  });

  it("passes recipe text verbatim in prompt", async () => {
    const specialRecipe = {
      recipeText:
        "Crème brûlée: ½ cup sugar, 2 cups cream, 5 egg yolks. Heat cream to 80°C. 🍮",
    };
    const request = createRequest(specialRecipe);
    await POST(request);

    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.prompt).toContain("Crème brûlée");
    expect(callArgs.prompt).toContain("½ cup");
    expect(callArgs.prompt).toContain("80°C");
    expect(callArgs.prompt).toContain("🍮");
  });

  it("handles long recipe text", async () => {
    const longRecipe = {
      recipeText: "Step ".repeat(500) + "Final step.",
    };
    const request = createRequest(longRecipe);
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockStreamText).toHaveBeenCalledTimes(1);
  });

  it("calls toTextStreamResponse on the stream result", async () => {
    const request = createRequest(validRequest);
    await POST(request);

    expect(mockToTextStreamResponse).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when streamText throws", async () => {
    mockStreamText.mockImplementation(() => {
      throw new Error("AI error");
    });

    const request = createRequest(validRequest);
    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to convert recipe");
  });

  it("uses GPT-4o model for conversion", async () => {
    const request = createRequest(validRequest);
    await POST(request);

    const callArgs = mockStreamText.mock.calls[0][0];
    expect(callArgs.model).toBe("openai/gpt-4o");
  });
});
