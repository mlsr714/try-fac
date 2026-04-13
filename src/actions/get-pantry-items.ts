"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { pantryItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export type PantryItem = {
  id: string;
  name: string;
  createdAt: Date;
};

export async function getPantryItems(): Promise<
  { items: PantryItem[] } | { error: string }
> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: "Not authenticated" };
    }

    const items = await db
      .select({
        id: pantryItems.id,
        name: pantryItems.name,
        createdAt: pantryItems.createdAt,
      })
      .from(pantryItems)
      .where(eq(pantryItems.userId, userId))
      .orderBy(asc(pantryItems.name));

    return { items };
  } catch (error) {
    console.error("Error fetching pantry items:", error);
    return { error: "Failed to fetch pantry items" };
  }
}
