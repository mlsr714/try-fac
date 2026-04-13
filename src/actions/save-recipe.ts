"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import type { FullRecipe } from "@/lib/schemas/generation";

export async function saveRecipe(recipe: FullRecipe): Promise<{ id: string } | { error: string }> {
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
        summary: recipe.summary,
        servings: recipe.servings,
        activeTime: recipe.activeTime,
        totalTime: recipe.totalTime,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        nutrition: recipe.nutrition,
        tools: recipe.tools,
        thermomixInstructions: recipe.thermomixInstructions,
        sourceType: "generated",
      })
      .returning({ id: recipes.id });

    return { id: saved.id };
  } catch (error) {
    console.error("Error saving recipe:", error);
    return { error: "Failed to save recipe" };
  }
}
