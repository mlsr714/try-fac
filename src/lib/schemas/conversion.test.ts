import { describe, expect, it } from "vitest";
import { convertRequestSchema } from "./conversion";

describe("convertRequestSchema", () => {
  it("rejects whitespace-only recipe text", () => {
    const result = convertRequestSchema.safeParse({ recipeText: "   \n\t   " });

    expect(result.success).toBe(false);
  });

  it("trims recipe text before returning parsed data", () => {
    const result = convertRequestSchema.safeParse({
      recipeText: "  Garlic Butter Pasta  ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.recipeText).toBe("Garlic Butter Pasta");
    }
  });
});
