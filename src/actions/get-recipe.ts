"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type RecipeDetail = {
  id: string;
  title: string;
  summary: string | null;
  servings: number | null;
  activeTime: string | null;
  totalTime: string | null;
  ingredients: unknown;
  instructions: unknown;
  nutrition: unknown;
  tools: unknown;
  thermomixInstructions: unknown;
  sourceType: string;
  createdAt: Date;
};

export async function getRecipe(
  id: string
): Promise<{ recipe: RecipeDetail } | { error: string }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: "Not authenticated" };
    }

    const [recipe] = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .limit(1);

    if (!recipe) {
      return { error: "Recipe not found" };
    }

    return { recipe };
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return { error: "Failed to fetch recipe" };
  }
}
