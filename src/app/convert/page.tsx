"use client";

import { useState, useCallback, useRef } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { Loader2, BookmarkPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConvertedRecipeDisplay } from "@/components/converted-recipe-display";
import { saveConvertedRecipe } from "@/actions/save-converted-recipe";
import { convertedRecipeSchema } from "@/lib/schemas/conversion";
import type { ConvertedRecipe } from "@/lib/schemas/conversion";

export default function ConvertPage() {
  const [recipeText, setRecipeText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const completedRecipe = useRef<ConvertedRecipe | null>(null);

  const { object, submit, isLoading, error } = useObject({
    api: "/api/convert",
    schema: convertedRecipeSchema,
    onFinish: ({ object: finishedObject }) => {
      if (finishedObject) {
        completedRecipe.current = finishedObject;
        setIsComplete(true);
      }
    },
    onError: (err) => {
      console.error("Conversion error:", err);
    },
  });

  const handleConvert = useCallback(() => {
    if (!recipeText.trim() || isLoading) return;

    // Reset states for new conversion
    setIsComplete(false);
    setSavedRecipeId(null);
    setSaveError(null);
    completedRecipe.current = null;

    submit({ recipeText: recipeText.trim() });
  }, [recipeText, isLoading, submit]);

  const handleSave = useCallback(async () => {
    if (!completedRecipe.current || isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await saveConvertedRecipe(completedRecipe.current);
      if ("id" in result) {
        setSavedRecipeId(result.id);
      } else {
        setSaveError(result.error);
      }
    } catch {
      setSaveError("Failed to save recipe");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving]);

  const isTextEmpty = !recipeText.trim();
  const isConvertDisabled = isTextEmpty || isLoading;
  const showSaveButton = isComplete && !savedRecipeId;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Convert a Recipe</h1>
      <p className="mt-2 text-muted-foreground">
        Paste any recipe text below and we&apos;ll convert it into a structured
        format with Thermomix-compatible instructions.
      </p>

      <div className="mt-8 space-y-4">
        {/* Textarea for recipe input */}
        <Textarea
          placeholder="Paste your recipe here..."
          value={recipeText}
          onChange={(e) => setRecipeText(e.target.value)}
          rows={10}
          className="min-h-[200px] resize-y text-base"
          data-testid="recipe-textarea"
        />

        {/* Convert button */}
        <Button
          onClick={handleConvert}
          disabled={isConvertDisabled}
          className="w-full sm:w-auto"
          size="lg"
          data-testid="convert-button"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Converting...
            </>
          ) : (
            "Convert"
          )}
        </Button>
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">
            Failed to convert recipe. Please try again.
          </p>
        </div>
      )}

      {/* Conversion result */}
      {object && (
        <div className="mt-8">
          <ConvertedRecipeDisplay recipe={object} isStreaming={isLoading} />
        </div>
      )}

      {/* Save button - only visible after complete conversion */}
      {showSaveButton && (
        <div className="mt-6">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="default"
            size="lg"
            data-testid="save-button"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <BookmarkPlus className="mr-2 size-4" />
                Save to Collection
              </>
            )}
          </Button>
        </div>
      )}

      {/* Save success feedback */}
      {savedRecipeId && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-900 dark:bg-green-950/20">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="size-4" />
            <span>Recipe saved to your collection!</span>
          </div>
        </div>
      )}

      {/* Save error feedback */}
      {saveError && (
        <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Error saving: {saveError}
          </p>
        </div>
      )}
    </div>
  );
}
