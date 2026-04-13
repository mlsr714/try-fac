import { describe, it, expect } from "vitest";
import { POST } from "./route";

function createRequest(body: unknown) {
  return new Request("http://localhost:3100/api/generate/ideas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/generate/ideas", () => {
  it("returns 3 mock ideas for valid constraints", async () => {
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

  it("ideas reflect the selected constraints", async () => {
    const request = createRequest({
      diet: "Keto",
      mealType: "Lunch",
      difficulty: "Hard",
      maxCookingTime: 45,
      servings: 2,
      ingredients: "chicken, avocado",
      additionalInstructions: "Extra spicy",
      includePantryItems: true,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.ideas).toHaveLength(3);

    // Mock data uses constraint values in titles/descriptions
    const allText = data.ideas
      .map((i: { title: string; description: string }) => `${i.title} ${i.description}`)
      .join(" ");
    expect(allText).toContain("Lunch");
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
});
