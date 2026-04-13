"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { pantryItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function deletePantryItem(
  id: string
): Promise<{ success: true } | { error: string }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: "Not authenticated" };
    }

    const result = await db
      .delete(pantryItems)
      .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, userId)))
      .returning({ id: pantryItems.id });

    if (result.length === 0) {
      return { error: "Ingredient not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting pantry item:", error);
    return { error: "Failed to delete ingredient" };
  }
}
