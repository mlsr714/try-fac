"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pantryItems } from "@/db/schema";

const DUPLICATE_ERROR = "Ingredient already exists in your pantry";

export async function addPantryItem(
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

    const normalizedName = trimmedName.toLocaleLowerCase();
    const existingItems = await db
      .select({ id: pantryItems.id, name: pantryItems.name })
      .from(pantryItems)
      .where(eq(pantryItems.userId, userId));

    const hasDuplicate = existingItems.some(
      (item) => item.name.trim().toLocaleLowerCase() === normalizedName
    );

    if (hasDuplicate) {
      return { error: DUPLICATE_ERROR };
    }

    const [item] = await db
      .insert(pantryItems)
      .values({
        userId,
        name: trimmedName,
      })
      .returning({ id: pantryItems.id, name: pantryItems.name });

    return { item };
  } catch (error) {
    console.error("Error adding pantry item:", error);
    return { error: "Failed to add ingredient" };
  }
}
