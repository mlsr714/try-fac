"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function deleteRecipe(
  id: string
): Promise<{ success: true } | { error: string }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: "Not authenticated" };
    }

    const result = await db
      .delete(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning({ id: recipes.id });

    if (result.length === 0) {
      return { error: "Recipe not found" };
    }

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return { error: "Failed to delete recipe" };
  }
}
