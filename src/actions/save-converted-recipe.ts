"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import type { ConvertedRecipe } from "@/lib/schemas/conversion";

export async function saveConvertedRecipe(
  recipe: ConvertedRecipe
): Promise<{ id: string } | { error: string }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: "Not authenticated" };
    }

    const [saved] = await db
      .insert(recipes)
      .values({
        userId,
        title: recipe.title,
        summary: null,
        servings: null,
        activeTime: null,
        totalTime: null,
        ingredients: recipe.ingredients,
        instructions: recipe.steps,
        nutrition: null,
        tools: null,
        thermomixInstructions: recipe.thermomixInstructions,
        sourceType: "converted",
      })
      .returning({ id: recipes.id });

    return { id: saved.id };
  } catch (error) {
    console.error("Error saving converted recipe:", error);
    return { error: "Failed to save recipe" };
  }
}
