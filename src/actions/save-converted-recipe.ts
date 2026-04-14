"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { syncUser } from "@/actions/sync-user";
import type { ConvertedRecipe } from "@/lib/schemas/conversion";

export async function saveConvertedRecipe(
  recipe: ConvertedRecipe
): Promise<{ id: string } | { error: string }> {
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

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${saved.id}`);

    return { id: saved.id };
  } catch (error) {
    console.error("Error saving converted recipe:", error);
    return { error: "Failed to save recipe" };
  }
}
