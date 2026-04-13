"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { pantryItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function updatePantryItem(
  id: string,
  name: string
): Promise<{ item: { id: string; name: string } } | { error: string }> {
  try {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return { error: "Ingredient name is required" };
    }

    const { userId } = await auth();

    if (!userId) {
      return { error: "Not authenticated" };
    }

    const [item] = await db
      .update(pantryItems)
      .set({ name: trimmedName, updatedAt: new Date() })
      .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, userId)))
      .returning({ id: pantryItems.id, name: pantryItems.name });

    if (!item) {
      return { error: "Ingredient not found" };
    }

    return { item };
  } catch (error) {
    console.error("Error updating pantry item:", error);
    return { error: "Failed to update ingredient" };
  }
}
