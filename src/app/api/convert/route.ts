import { NextResponse } from "next/server";
import { streamText, Output } from "ai";
import { gateway } from "ai";
import {
  convertRequestSchema,
  convertedRecipeSchema,
} from "@/lib/schemas/conversion";

function buildConversionPrompt(recipeText: string): string {
  const lines: string[] = [
    "Convert the following recipe text into a structured format with Thermomix-compatible instructions.",
    "",
    "Recipe text:",
    recipeText,
    "",
    "Requirements:",
    "1. Extract a clear title from the recipe text. If none is obvious, create a descriptive title.",
    "2. Parse all ingredients into structured format with name, amount, and unit. If amounts are vague (e.g., 'a pinch'), keep them as-is.",
    "3. Normalize the cooking steps into clear, ordered instructions.",
    "4. Create Thermomix-specific instructions for the ENTIRE recipe workflow:",
    "   - Speed: Use Speed 1-10, Turbo, or Stir/Reverse as appropriate",
    "   - Temperature: Use specific temperatures (37°C-120°C), Varoma for steaming, or 'No heat' for cold steps",
    "   - Time: Specify duration for each step (e.g., '5 min', '30 sec')",
    "   - Bowl: Indicate bowl configuration (Main bowl, Simmering basket, Varoma tray, Varoma dish)",
    "   - Accessories: List any accessories needed (Butterfly whisk, Spatula, Measuring cup, None)",
    "5. If the recipe involves steaming, include Varoma-specific steps with Varoma temperature and tray/dish placement.",
    "6. Warnings:",
    "   - If the recipe is fully specified (all quantities, temperatures, and times are explicit), set warnings to null.",
    "   - If you had to assume any quantities, temperatures, cooking times, or other details, list each assumption as a warning string.",
    "   - Examples: 'Assumed 200g flour as no quantity was specified', 'Assumed baking at 180°C as no temperature was given'",
    "7. Handle special characters (fractions ½ ¾, degree symbols °C/°F, accented characters, emoji) correctly.",
    "8. If the input is very short or vague, do your best to create a reasonable conversion but add appropriate warnings about all assumptions made.",
  ];

  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = convertRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.issues },
        { status: 400 }
      );
    }

    const { recipeText } = result.data;
    const prompt = buildConversionPrompt(recipeText);

    const streamResult = streamText({
      model: gateway("openai/gpt-4o"),
      output: Output.object({
        schema: convertedRecipeSchema,
      }),
      prompt,
    });

    return streamResult.toTextStreamResponse();
  } catch (error) {
    console.error("Error converting recipe:", error);
    return NextResponse.json(
      { error: "Failed to convert recipe" },
      { status: 500 }
    );
  }
}
