import { streamText, Output } from "ai";
import { gateway } from "ai";
import {
  fullRecipeSchema,
  generateRecipeRequestSchema,
} from "@/lib/schemas/generation";
import type { ConstraintFormValues, RecipeIdea } from "@/lib/schemas/generation";

function buildRecipePrompt(
  idea: RecipeIdea,
  constraints: ConstraintFormValues
): string {
  const lines: string[] = [
    `Generate a complete, detailed recipe based on the following idea and constraints.`,
    "",
    `Selected Recipe Idea:`,
    `- Title: ${idea.title}`,
    `- Description: ${idea.description}`,
    `- Estimated Time: ${idea.estimatedTime}`,
    `- Tools: ${idea.tools.join(", ") || "None specified"}`,
    "",
    `Constraints:`,
    `- Diet: ${constraints.diet}`,
    `- Meal Type: ${constraints.mealType}`,
    `- Difficulty: ${constraints.difficulty}`,
    `- Max Active Cooking Time: ${constraints.maxCookingTime} minutes`,
    `- Servings: ${constraints.servings}`,
  ];

  if (constraints.ingredients && constraints.ingredients.trim()) {
    lines.push(`- Available Ingredients: ${constraints.ingredients}`);
  }

  if (
    constraints.additionalInstructions &&
    constraints.additionalInstructions.trim()
  ) {
    lines.push(
      `- Additional Instructions: ${constraints.additionalInstructions}`
    );
  }

  lines.push("");
  lines.push("Requirements:");
  lines.push(
    "- The recipe MUST strictly respect the diet constraint. For example, Vegan means no animal products."
  );
  lines.push(
    `- The active cooking time MUST NOT exceed ${constraints.maxCookingTime} minutes.`
  );
  lines.push(`- The recipe should serve exactly ${constraints.servings}.`);
  lines.push(
    "- Include detailed step-by-step instructions with clear measurements."
  );
  lines.push("- Provide realistic nutrition estimates per serving.");
  lines.push("- List all required cooking tools and equipment.");
  lines.push(
    "- If the recipe involves processes suitable for Thermomix (blending, steaming, kneading, mixing), include Thermomix-specific instructions with speed, temperature, time, and bowl settings. Otherwise, set thermomixInstructions to null."
  );

  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = generateRecipeRequestSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: result.error.issues,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { idea, constraints } = result.data;
    const prompt = buildRecipePrompt(idea, constraints);

    const streamResult = streamText({
      model: gateway("openai/gpt-4o"),
      output: Output.object({
        schema: fullRecipeSchema,
      }),
      prompt,
    });

    return streamResult.toTextStreamResponse();
  } catch (error) {
    console.error("Error generating recipe:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate recipe" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
