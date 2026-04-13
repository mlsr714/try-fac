import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

// Mock the AI SDK
vi.mock("ai", () => ({
  generateText: vi.fn(),
  Output: {
    object: vi.fn((opts: unknown) => opts),
  },
  gateway: vi.fn((model: string) => model),
}));

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "test-user-id" }),
}));

// Mock the database
vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  pantryItems: { name: "name", userId: "user_id" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

const mockGenerateText = vi.mocked(
  (await import("ai")).generateText
);

const mockIdeas = {
  ideas: [
    {
      title: "Vegan Dinner Bowl",
      description:
        "A hearty plant-based dinner bowl packed with roasted vegetables and quinoa.",
      estimatedTime: "25 min",
      tools: ["Baking sheet", "Mixing bowl"],
    },
    {
      title: "Tofu Stir-Fry",
      description:
        "Crispy tofu with seasonal vegetables in a savory soy-ginger sauce.",
      estimatedTime: "20 min",
      tools: ["Wok", "Cutting board"],
    },
    {
      title: "Chickpea Curry",
      description:
        "A warming spiced chickpea curry with coconut milk and fresh herbs.",
      estimatedTime: "30 min",
      tools: ["Saucepan", "Chef's knife"],
    },
  ],
};

function createRequest(body: unknown) {
  return new Request("http://localhost:3100/api/generate/ideas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/generate/ideas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateText.mockResolvedValue({
      output: mockIdeas,
    } as ReturnType<typeof mockGenerateText> extends Promise<infer T> ? T : never);
  });

  it("returns 3 ideas for valid constraints", async () => {
    const request = createRequest({
      diet: "Vegan",
      mealType: "Dinner",
      difficulty: "Easy",
      maxCookingTime: 30,
      servings: 4,
      ingredients: "",
      additionalInstructions: "",
      includePantryItems: false,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.ideas).toHaveLength(3);

    // Each idea has the expected shape
    for (const idea of data.ideas) {
      expect(idea).toHaveProperty("title");
      expect(idea).toHaveProperty("description");
      expect(idea).toHaveProperty("estimatedTime");
      expect(idea).toHaveProperty("tools");
      expect(typeof idea.title).toBe("string");
      expect(typeof idea.description).toBe("string");
      expect(Array.isArray(idea.tools)).toBe(true);
    }
  });

  it("returns 400 for invalid constraints (missing required fields)", async () => {
    const request = createRequest({
      diet: "Vegan",
      // Missing other required fields
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Invalid constraints");
  });

  it("returns 400 for zero servings", async () => {
    const request = createRequest({
      diet: "Vegan",
      mealType: "Dinner",
      difficulty: "Easy",
      maxCookingTime: 30,
      servings: 0,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 for negative cooking time", async () => {
    const request = createRequest({
      diet: "Vegan",
      mealType: "Dinner",
      difficulty: "Easy",
      maxCookingTime: -10,
      servings: 4,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("calls generateText with correct model and output schema", async () => {
    const request = createRequest({
      diet: "Keto",
      mealType: "Lunch",
      difficulty: "Hard",
      maxCookingTime: 45,
      servings: 2,
      ingredients: "chicken, avocado",
      additionalInstructions: "Extra spicy",
      includePantryItems: false,
    });

    await POST(request);

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.prompt).toContain("Keto");
    expect(callArgs.prompt).toContain("Lunch");
    expect(callArgs.prompt).toContain("Hard");
    expect(callArgs.prompt).toContain("45");
    expect(callArgs.prompt).toContain("chicken, avocado");
    expect(callArgs.prompt).toContain("Extra spicy");
  });

  it("accepts minimal valid constraints (optional fields omitted)", async () => {
    const request = createRequest({
      diet: "No Restriction",
      mealType: "Breakfast",
      difficulty: "Easy",
      maxCookingTime: 15,
      servings: 1,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.ideas).toHaveLength(3);
  });

  it("returns 500 when AI fails to generate output", async () => {
    mockGenerateText.mockResolvedValue({
      output: null,
    } as ReturnType<typeof mockGenerateText> extends Promise<infer T> ? T : never);

    const request = createRequest({
      diet: "Vegan",
      mealType: "Dinner",
      difficulty: "Easy",
      maxCookingTime: 30,
      servings: 4,
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it("includes pantry items in prompt when toggle is on", async () => {
    const { db } = await import("@/db");
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { name: "Rice" },
          { name: "Olive Oil" },
          { name: "Garlic" },
        ]),
      }),
    } as unknown as ReturnType<typeof db.select>);

    const request = createRequest({
      diet: "Vegan",
      mealType: "Dinner",
      difficulty: "Easy",
      maxCookingTime: 30,
      servings: 4,
      includePantryItems: true,
    });

    await POST(request);

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.prompt).toContain("Rice");
    expect(callArgs.prompt).toContain("Olive Oil");
    expect(callArgs.prompt).toContain("Garlic");
    expect(callArgs.prompt).toContain("Pantry Items");
  });

  it("does not include pantry section when toggle is off", async () => {
    const request = createRequest({
      diet: "Vegan",
      mealType: "Dinner",
      difficulty: "Easy",
      maxCookingTime: 30,
      servings: 4,
      includePantryItems: false,
    });

    await POST(request);

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.prompt).not.toContain("Pantry Items");
  });

  it("includes refinement text in prompt when provided", async () => {
    const request = createRequest({
      diet: "Vegan",
      mealType: "Dinner",
      difficulty: "Easy",
      maxCookingTime: 30,
      servings: 4,
      includePantryItems: false,
      refinementText: "Make it more Mediterranean",
    });

    await POST(request);

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.prompt).toContain("Refinement");
    expect(callArgs.prompt).toContain("Make it more Mediterranean");
  });

  it("does not include refinement section when refinementText is not provided", async () => {
    const request = createRequest({
      diet: "Vegan",
      mealType: "Dinner",
      difficulty: "Easy",
      maxCookingTime: 30,
      servings: 4,
      includePantryItems: false,
    });

    await POST(request);

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.prompt).not.toContain("Refinement");
  });

  it("does not include refinement section when refinementText is empty string", async () => {
    const request = createRequest({
      diet: "Vegan",
      mealType: "Dinner",
      difficulty: "Easy",
      maxCookingTime: 30,
      servings: 4,
      includePantryItems: false,
      refinementText: "",
    });

    await POST(request);

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.prompt).not.toContain("Refinement");
  });

  it("returns 3 ideas when refinement text is provided", async () => {
    const request = createRequest({
      diet: "Keto",
      mealType: "Lunch",
      difficulty: "Medium",
      maxCookingTime: 45,
      servings: 2,
      includePantryItems: false,
      refinementText: "More Asian-inspired",
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.ideas).toHaveLength(3);
  });
});
