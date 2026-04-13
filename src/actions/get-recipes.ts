"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export type RecipeListItem = {
  id: string;
  title: string;
  summary: string | null;
  sourceType: string;
  createdAt: Date;
};

export async function getRecipes(): Promise<
  { recipes: RecipeListItem[] } | { error: string }
> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: "Not authenticated" };
    }

    const userRecipes = await db
      .select({
        id: recipes.id,
        title: recipes.title,
        summary: recipes.summary,
        sourceType: recipes.sourceType,
        createdAt: recipes.createdAt,
      })
      .from(recipes)
      .where(eq(recipes.userId, userId))
      .orderBy(desc(recipes.createdAt));

    return { recipes: userRecipes };
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return { error: "Failed to fetch recipes" };
  }
}
