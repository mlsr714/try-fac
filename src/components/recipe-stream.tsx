"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import Link from "next/link";
import { Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RecipeDisplay } from "@/components/recipe-display";
import { saveRecipe } from "@/actions/save-recipe";
import { fullRecipeSchema } from "@/lib/schemas/generation";
import type { ConstraintFormValues, RecipeIdea, FullRecipe } from "@/lib/schemas/generation";

interface RecipeStreamProps {
  idea: RecipeIdea;
  constraints: ConstraintFormValues;
}

export function RecipeStream({ idea, constraints }: RecipeStreamProps) {
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasSubmitted = useRef(false);
  const hasSaved = useRef(false);

  const handleSave = useCallback(async (recipe: FullRecipe) => {
    if (hasSaved.current) return;
    hasSaved.current = true;
    setIsSaving(true);
    try {
      const result = await saveRecipe(recipe);
      if ("id" in result) {
        setSavedRecipeId(result.id);
      } else {
        setSaveError(result.error);
        hasSaved.current = false;
      }
    } catch {
      setSaveError("Failed to save recipe");
      hasSaved.current = false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const { object, submit, isLoading, error } = useObject({
    api: "/api/generate/recipe",
    schema: fullRecipeSchema,
    onFinish: async ({ object: finishedObject }) => {
      if (finishedObject) {
        await handleSave(finishedObject);
      }
    },
    onError: (err) => {
      console.error("Streaming error:", err);
    },
  });

  useEffect(() => {
    if (!hasSubmitted.current) {
      hasSubmitted.current = true;
      submit({ idea, constraints });
    }
  }, [idea, constraints, submit]);

  // Loading state before any data arrives
  if (!object && isLoading && !error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Generating your recipe...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive">
          Failed to generate recipe. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recipe content (streams in progressively) */}
      {object && <RecipeDisplay recipe={object} isStreaming={isLoading} />}

      {/* Save status */}
      {!isLoading && (
        <div className="rounded-lg border bg-card p-4">
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>Saving recipe...</span>
            </div>
          )}
          {savedRecipeId && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="size-4" />
                <span>Recipe saved successfully!</span>
              </div>
              <Link
                href={`/recipes/${savedRecipeId}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <ExternalLink className="mr-2 size-4" />
                View Saved Recipe
              </Link>
            </div>
          )}
          {saveError && (
            <p className="text-sm text-destructive">
              Error saving: {saveError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
