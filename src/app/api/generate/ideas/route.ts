import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateText, Output } from "ai";
import { gateway } from "ai";
import { z } from "zod";
import {
  constraintFormSchema,
  recipeIdeaSchema,
} from "@/lib/schemas/generation";
import { db } from "@/db";
import { pantryItems } from "@/db/schema";
import { eq } from "drizzle-orm";

const ideasOutputSchema = z.object({
  ideas: z
    .array(recipeIdeaSchema)
    .length(3)
    .describe("Exactly 3 recipe ideas"),
});

function buildPrompt(
  constraints: z.infer<typeof constraintFormSchema>,
  pantryItemNames: string[]
): string {
  const lines: string[] = [
    "Generate exactly 3 creative recipe ideas based on the following constraints:",
    "",
    `Diet: ${constraints.diet}`,
    `Meal Type: ${constraints.mealType}`,
    `Difficulty: ${constraints.difficulty}`,
    `Max Active Cooking Time: ${constraints.maxCookingTime} minutes`,
    `Servings: ${constraints.servings}`,
  ];

  if (constraints.ingredients && constraints.ingredients.trim()) {
    lines.push(`Available Ingredients: ${constraints.ingredients}`);
  }

  if (pantryItemNames.length > 0) {
    lines.push(`Pantry Items: ${pantryItemNames.join(", ")}`);
  }

  if (
    constraints.additionalInstructions &&
    constraints.additionalInstructions.trim()
  ) {
    lines.push(`Additional Instructions: ${constraints.additionalInstructions}`);
  }

  if (constraints.refinementText && constraints.refinementText.trim()) {
    lines.push("");
    lines.push(
      `Refinement: The user wants to refine the previous ideas with this instruction: "${constraints.refinementText}". Generate 3 NEW and DIFFERENT recipe ideas that incorporate this refinement while still respecting all the original constraints above.`
    );
  }

  lines.push("");
  lines.push(
    "Each recipe idea must have a title, a short description (1-2 sentences), an estimated active cooking time (e.g. '25 min'), and a list of required cooking tools."
  );
  lines.push(
    "All ideas MUST respect the diet constraint strictly. For example, Vegan means no animal products whatsoever."
  );
  lines.push(
    "The estimated time should not exceed the max active cooking time."
  );

  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = constraintFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid constraints", details: result.error.issues },
        { status: 400 }
      );
    }

    const constraints = result.data;

    // Fetch pantry items if toggle is on
    let pantryItemNames: string[] = [];
    if (constraints.includePantryItems) {
      try {
        const { userId } = await auth();
        if (userId) {
          const items = await db
            .select({ name: pantryItems.name })
            .from(pantryItems)
            .where(eq(pantryItems.userId, userId));
          pantryItemNames = items.map((item) => item.name);
        }
      } catch {
        // If auth or DB fails for pantry, continue without pantry items
      }
    }

    const prompt = buildPrompt(constraints, pantryItemNames);

    const { output } = await generateText({
      model: gateway("openai/gpt-4o-mini"),
      output: Output.object({
        schema: ideasOutputSchema,
      }),
      prompt,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Failed to generate ideas" },
        { status: 500 }
      );
    }

    return NextResponse.json(output);
  } catch (error) {
    console.error("Error generating ideas:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
