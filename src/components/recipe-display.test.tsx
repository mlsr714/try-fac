import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecipeDisplay } from "./recipe-display";
import type { FullRecipe } from "@/lib/schemas/generation";
import type { DeepPartial } from "ai";

const fullRecipe: FullRecipe = {
  title: "Vegan Buddha Bowl",
  summary: "A hearty plant-based bowl with roasted vegetables and quinoa.",
  servings: 4,
  activeTime: "25 min",
  totalTime: "35 min",
  ingredients: [
    { name: "Quinoa", amount: "1", unit: "cup" },
    { name: "Sweet Potato", amount: "2", unit: "medium" },
    { name: "Chickpeas", amount: "400", unit: "g" },
  ],
  instructions: [
    { step: 1, text: "Cook quinoa according to package instructions." },
    { step: 2, text: "Roast sweet potatoes at 400°F for 25 minutes." },
    { step: 3, text: "Assemble the bowl with all components." },
  ],
  nutrition: {
    calories: 450,
    protein: 15,
    carbs: 65,
    fat: 12,
  },
  tools: ["Baking sheet", "Saucepan", "Mixing bowl"],
  thermomixInstructions: null,
};

describe("RecipeDisplay", () => {
  it("renders recipe title", () => {
    render(<RecipeDisplay recipe={fullRecipe} />);
    expect(screen.getByText("Vegan Buddha Bowl")).toBeInTheDocument();
  });

  it("renders recipe summary", () => {
    render(<RecipeDisplay recipe={fullRecipe} />);
    expect(
      screen.getByText(
        "A hearty plant-based bowl with roasted vegetables and quinoa."
      )
    ).toBeInTheDocument();
  });

  it("renders servings count", () => {
    render(<RecipeDisplay recipe={fullRecipe} />);
    expect(screen.getByText("4 servings")).toBeInTheDocument();
  });

  it("renders active and total time", () => {
    render(<RecipeDisplay recipe={fullRecipe} />);
    expect(screen.getByText("Active: 25 min")).toBeInTheDocument();
    expect(screen.getByText("Total: 35 min")).toBeInTheDocument();
  });

  it("renders all ingredients", () => {
    render(<RecipeDisplay recipe={fullRecipe} />);
    expect(screen.getByText("Quinoa")).toBeInTheDocument();
    expect(screen.getByText("Sweet Potato")).toBeInTheDocument();
    expect(screen.getByText("Chickpeas")).toBeInTheDocument();
  });

  it("renders all instruction steps", () => {
    render(<RecipeDisplay recipe={fullRecipe} />);
    expect(
      screen.getByText("Cook quinoa according to package instructions.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Roast sweet potatoes at 400°F for 25 minutes.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Assemble the bowl with all components.")
    ).toBeInTheDocument();
  });

  it("renders nutrition information", () => {
    render(<RecipeDisplay recipe={fullRecipe} />);
    expect(screen.getByText("450")).toBeInTheDocument();
    expect(screen.getByText("15g")).toBeInTheDocument();
    expect(screen.getByText("65g")).toBeInTheDocument();
    expect(screen.getByText("12g")).toBeInTheDocument();
  });

  it("renders required tools", () => {
    render(<RecipeDisplay recipe={fullRecipe} />);
    expect(screen.getByText("Baking sheet")).toBeInTheDocument();
    expect(screen.getByText("Saucepan")).toBeInTheDocument();
    expect(screen.getByText("Mixing bowl")).toBeInTheDocument();
  });

  it("does not render Thermomix section when instructions are null", () => {
    render(<RecipeDisplay recipe={fullRecipe} />);
    expect(
      screen.queryByText("Thermomix Instructions")
    ).not.toBeInTheDocument();
  });

  it("renders Thermomix instructions when present", () => {
    const recipeWithThermomix: FullRecipe = {
      ...fullRecipe,
      thermomixInstructions: [
        {
          step: 1,
          text: "Blend ingredients until smooth",
          speed: "Speed 7",
          temperature: "37°C",
          time: "30 sec",
          bowl: "Main bowl",
        },
      ],
    };

    render(<RecipeDisplay recipe={recipeWithThermomix} />);
    expect(
      screen.getByText("🤖 Thermomix Instructions")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Blend ingredients until smooth")
    ).toBeInTheDocument();
    expect(screen.getByText(/Speed 7/)).toBeInTheDocument();
    expect(screen.getByText(/37°C/)).toBeInTheDocument();
    expect(screen.getByText(/30 sec/)).toBeInTheDocument();
    expect(screen.getByText(/Main bowl/)).toBeInTheDocument();
  });

  it("shows streaming indicator when isStreaming is true", () => {
    render(<RecipeDisplay recipe={fullRecipe} isStreaming={true} />);
    expect(screen.getByText("Generating recipe...")).toBeInTheDocument();
  });

  it("does not show streaming indicator when isStreaming is false", () => {
    render(<RecipeDisplay recipe={fullRecipe} isStreaming={false} />);
    expect(
      screen.queryByText("Generating recipe...")
    ).not.toBeInTheDocument();
  });

  it("renders partial recipe data (during streaming)", () => {
    const partialRecipe: DeepPartial<FullRecipe> = {
      title: "Partial Recipe",
      summary: "Starting to stream...",
      ingredients: [
        { name: "Flour", amount: "2", unit: "cups" },
      ],
    };

    render(<RecipeDisplay recipe={partialRecipe} isStreaming={true} />);
    expect(screen.getByText("Partial Recipe")).toBeInTheDocument();
    expect(screen.getByText("Starting to stream...")).toBeInTheDocument();
    expect(screen.getByText("Flour")).toBeInTheDocument();
    expect(screen.getByText("Generating recipe...")).toBeInTheDocument();
  });
});
