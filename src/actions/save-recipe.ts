"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { syncUser } from "@/actions/sync-user";
import type { FullRecipe } from "@/lib/schemas/generation";

export async function saveRecipe(recipe: FullRecipe): Promise<{ id: string } | { error: string }> {
  try {
    const syncedUser = await syncUser();

    if (!syncedUser) {
      return { error: "Not authenticated" };
    }

    const userId = syncedUser.id;

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

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${saved.id}`);

    return { id: saved.id };
  } catch (error) {
    console.error("Error saving recipe:", error);
    return { error: "Failed to save recipe" };
  }
}
