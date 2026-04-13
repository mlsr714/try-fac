"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Syncs the currently authenticated Clerk user to the database.
 * Uses an upsert pattern: creates the user if they don't exist,
 * updates their info if they do.
 */
export async function syncUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();

  if (!user) {
    return null;
  }

  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
  const imageUrl = user.imageUrl ?? null;

  // Upsert: insert if not exists, update if exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(users).values({
      id: userId,
      email,
      name,
      imageUrl,
    });
  } else {
    await db
      .update(users)
      .set({
        email,
        name,
        imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  return { id: userId, email, name, imageUrl };
}
