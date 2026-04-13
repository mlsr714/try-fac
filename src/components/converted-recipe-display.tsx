"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeepPartial } from "ai";
import type { ConvertedRecipe } from "@/lib/schemas/conversion";

interface ConvertedRecipeDisplayProps {
  recipe: DeepPartial<ConvertedRecipe>;
  isStreaming?: boolean;
}

export function ConvertedRecipeDisplay({
  recipe,
  isStreaming = false,
}: ConvertedRecipeDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Title */}
      {recipe.title && (
        <h2 className="text-2xl font-bold tracking-tight">{recipe.title}</h2>
      )}

      {/* Ingredients */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recipe.ingredients.map(
                (ingredient, index) =>
                  ingredient && (
                    <li key={index} className="flex items-baseline gap-2">
                      <span className="font-medium">
                        {ingredient.amount}
                        {ingredient.unit ? ` ${ingredient.unit}` : ""}
                      </span>
                      <span>{ingredient.name}</span>
                    </li>
                  )
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Steps */}
      {recipe.steps && recipe.steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {recipe.steps.map(
                (step, index) =>
                  step && (
                    <li key={index} className="flex gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                        {step.step ?? index + 1}
                      </span>
                      <p className="pt-0.5">{step.text}</p>
                    </li>
                  )
              )}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Thermomix Instructions */}
      {recipe.thermomixInstructions &&
        recipe.thermomixInstructions.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="text-lg">
                🤖 Thermomix Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {recipe.thermomixInstructions.map(
                  (instruction, index) =>
                    instruction && (
                      <li key={index} className="space-y-1">
                        <div className="flex gap-3">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                            {instruction.step ?? index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">{instruction.text}</p>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {instruction.speed && (
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 dark:bg-blue-900">
                                  ⚡ {instruction.speed}
                                </span>
                              )}
                              {instruction.temperature && (
                                <span className="rounded bg-orange-100 px-1.5 py-0.5 dark:bg-orange-900">
                                  🌡️ {instruction.temperature}
                                </span>
                              )}
                              {instruction.time && (
                                <span className="rounded bg-green-100 px-1.5 py-0.5 dark:bg-green-900">
                                  ⏱️ {instruction.time}
                                </span>
                              )}
                              {instruction.bowl && (
                                <span className="rounded bg-purple-100 px-1.5 py-0.5 dark:bg-purple-900">
                                  🥣 {instruction.bowl}
                                </span>
                              )}
                              {instruction.accessories && (
                                <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">
                                  🔧 {instruction.accessories}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    )
                )}
              </ol>
            </CardContent>
          </Card>
        )}

      {/* Warnings */}
      {recipe.warnings && recipe.warnings.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-5" />
              Conversion Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recipe.warnings.map(
                (warning, index) =>
                  warning && (
                    <li
                      key={index}
                      className="text-sm text-amber-700 dark:text-amber-400"
                    >
                      • {warning}
                    </li>
                  )
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="size-2 animate-pulse rounded-full bg-primary" />
          <span>Converting recipe...</span>
        </div>
      )}
    </div>
  );
}
