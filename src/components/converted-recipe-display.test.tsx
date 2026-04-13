import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConvertedRecipeDisplay } from "./converted-recipe-display";
import type { DeepPartial } from "ai";
import type { ConvertedRecipe } from "@/lib/schemas/conversion";

const fullRecipe: DeepPartial<ConvertedRecipe> = {
  title: "Garlic Butter Pasta",
  ingredients: [
    { name: "Spaghetti", amount: "200", unit: "g" },
    { name: "Garlic", amount: "3", unit: "cloves" },
    { name: "Butter", amount: "50", unit: "g" },
  ],
  steps: [
    { step: 1, text: "Boil pasta in salted water." },
    { step: 2, text: "Sauté garlic in butter." },
    { step: 3, text: "Toss pasta with garlic butter." },
  ],
  thermomixInstructions: [
    {
      step: 1,
      text: "Boil water for pasta",
      speed: "Speed 1",
      temperature: "100°C",
      time: "10 min",
      bowl: "Main bowl",
      accessories: "None",
    },
    {
      step: 2,
      text: "Sauté garlic in butter",
      speed: "Speed 2",
      temperature: "Varoma",
      time: "3 min",
      bowl: "Main bowl",
      accessories: "Spatula",
    },
  ],
  warnings: null,
};

describe("ConvertedRecipeDisplay", () => {
  it("renders recipe title", () => {
    render(<ConvertedRecipeDisplay recipe={fullRecipe} />);
    expect(screen.getByText("Garlic Butter Pasta")).toBeDefined();
  });

  it("renders all ingredients", () => {
    render(<ConvertedRecipeDisplay recipe={fullRecipe} />);
    expect(screen.getByText("Spaghetti")).toBeDefined();
    expect(screen.getByText("Garlic")).toBeDefined();
    expect(screen.getByText("Butter")).toBeDefined();
  });

  it("renders ingredient amounts and units", () => {
    render(<ConvertedRecipeDisplay recipe={fullRecipe} />);
    expect(screen.getByText("200 g")).toBeDefined();
    expect(screen.getByText("3 cloves")).toBeDefined();
    expect(screen.getByText("50 g")).toBeDefined();
  });

  it("renders all instruction steps", () => {
    render(<ConvertedRecipeDisplay recipe={fullRecipe} />);
    expect(screen.getByText("Boil pasta in salted water.")).toBeDefined();
    expect(screen.getByText("Sauté garlic in butter.")).toBeDefined();
    expect(screen.getByText("Toss pasta with garlic butter.")).toBeDefined();
  });

  it("renders Thermomix instructions section", () => {
    render(<ConvertedRecipeDisplay recipe={fullRecipe} />);
    expect(
      screen.getByText("🤖 Thermomix Instructions")
    ).toBeDefined();
    expect(
      screen.getByText("Boil water for pasta")
    ).toBeDefined();
    expect(
      screen.getByText("Sauté garlic in butter")
    ).toBeDefined();
  });

  it("renders Thermomix speed settings", () => {
    render(<ConvertedRecipeDisplay recipe={fullRecipe} />);
    expect(screen.getByText("⚡ Speed 1")).toBeDefined();
    expect(screen.getByText("⚡ Speed 2")).toBeDefined();
  });

  it("renders Thermomix temperature settings", () => {
    render(<ConvertedRecipeDisplay recipe={fullRecipe} />);
    expect(screen.getByText("🌡️ 100°C")).toBeDefined();
    expect(screen.getByText("🌡️ Varoma")).toBeDefined();
  });

  it("renders Thermomix time settings", () => {
    render(<ConvertedRecipeDisplay recipe={fullRecipe} />);
    expect(screen.getByText("⏱️ 10 min")).toBeDefined();
    expect(screen.getByText("⏱️ 3 min")).toBeDefined();
  });

  it("renders Thermomix bowl settings", () => {
    render(<ConvertedRecipeDisplay recipe={fullRecipe} />);
    // Both steps have "Main bowl", so at least one should be found
    const bowlElements = screen.getAllByText("🥣 Main bowl");
    expect(bowlElements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Thermomix accessories", () => {
    render(<ConvertedRecipeDisplay recipe={fullRecipe} />);
    expect(screen.getByText("🔧 None")).toBeDefined();
    expect(screen.getByText("🔧 Spatula")).toBeDefined();
  });

  it("does not render warnings section when warnings is null", () => {
    render(<ConvertedRecipeDisplay recipe={fullRecipe} />);
    expect(screen.queryByText("Conversion Warnings")).toBeNull();
  });

  it("renders warnings section when warnings are present", () => {
    const recipeWithWarnings: DeepPartial<ConvertedRecipe> = {
      ...fullRecipe,
      warnings: [
        "Assumed 200g flour as no quantity was specified",
        "Assumed baking at 180°C as no temperature was given",
      ],
    };
    render(<ConvertedRecipeDisplay recipe={recipeWithWarnings} />);
    expect(screen.getByText("Conversion Warnings")).toBeDefined();
    expect(
      screen.getByText(
        "• Assumed 200g flour as no quantity was specified"
      )
    ).toBeDefined();
    expect(
      screen.getByText(
        "• Assumed baking at 180°C as no temperature was given"
      )
    ).toBeDefined();
  });

  it("shows streaming indicator when isStreaming is true", () => {
    render(<ConvertedRecipeDisplay recipe={fullRecipe} isStreaming={true} />);
    expect(screen.getByText("Converting recipe...")).toBeDefined();
  });

  it("does not show streaming indicator when isStreaming is false", () => {
    render(<ConvertedRecipeDisplay recipe={fullRecipe} isStreaming={false} />);
    expect(screen.queryByText("Converting recipe...")).toBeNull();
  });

  it("renders partial recipe data (during streaming)", () => {
    const partialRecipe: DeepPartial<ConvertedRecipe> = {
      title: "Partial Recipe",
      ingredients: [{ name: "Flour", amount: "200", unit: "g" }],
    };
    render(
      <ConvertedRecipeDisplay recipe={partialRecipe} isStreaming={true} />
    );
    expect(screen.getByText("Partial Recipe")).toBeDefined();
    expect(screen.getByText("Flour")).toBeDefined();
    // Steps and Thermomix sections should not render
    expect(screen.queryByText("Instructions")).toBeNull();
    expect(
      screen.queryByText("🤖 Thermomix Instructions")
    ).toBeNull();
  });
});
