import {
  Clock,
  Timer,
  Users,
  UtensilsCrossed,
  Flame,
  Beef,
  Wheat,
  Droplets,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeepPartial } from "ai";
import type { FullRecipe } from "@/lib/schemas/generation";

interface RecipeDisplayProps {
  recipe: DeepPartial<FullRecipe>;
  isStreaming?: boolean;
}

export function RecipeDisplay({ recipe, isStreaming = false }: RecipeDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Title */}
      {recipe.title && (
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{recipe.title}</h2>
          {recipe.summary && (
            <p className="mt-2 text-muted-foreground">{recipe.summary}</p>
          )}
        </div>
      )}

      {/* Metadata: Servings, Active Time, Total Time */}
      {(recipe.servings || recipe.activeTime || recipe.totalTime) && (
        <div className="flex flex-wrap gap-4">
          {recipe.servings && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="size-4 text-muted-foreground" />
              <span>{recipe.servings} servings</span>
            </div>
          )}
          {recipe.activeTime && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-muted-foreground" />
              <span>Active: {recipe.activeTime}</span>
            </div>
          )}
          {recipe.totalTime && (
            <div className="flex items-center gap-2 text-sm">
              <Timer className="size-4 text-muted-foreground" />
              <span>Total: {recipe.totalTime}</span>
            </div>
          )}
        </div>
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
                        {ingredient.amount} {ingredient.unit}
                      </span>
                      <span>{ingredient.name}</span>
                    </li>
                  )
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {recipe.instructions && recipe.instructions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {recipe.instructions.map(
                (instruction, index) =>
                  instruction && (
                    <li key={index} className="flex gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                        {instruction.step ?? index + 1}
                      </span>
                      <p className="pt-0.5">{instruction.text}</p>
                    </li>
                  )
              )}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Nutrition */}
      {recipe.nutrition && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nutrition (per serving)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {recipe.nutrition.calories !== undefined && (
                <div className="flex items-center gap-2">
                  <Flame className="size-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {recipe.nutrition.calories}
                    </p>
                    <p className="text-xs text-muted-foreground">Calories</p>
                  </div>
                </div>
              )}
              {recipe.nutrition.protein !== undefined && (
                <div className="flex items-center gap-2">
                  <Beef className="size-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {recipe.nutrition.protein}g
                    </p>
                    <p className="text-xs text-muted-foreground">Protein</p>
                  </div>
                </div>
              )}
              {recipe.nutrition.carbs !== undefined && (
                <div className="flex items-center gap-2">
                  <Wheat className="size-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {recipe.nutrition.carbs}g
                    </p>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                  </div>
                </div>
              )}
              {recipe.nutrition.fat !== undefined && (
                <div className="flex items-center gap-2">
                  <Droplets className="size-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {recipe.nutrition.fat}g
                    </p>
                    <p className="text-xs text-muted-foreground">Fat</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tools */}
      {recipe.tools && recipe.tools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Required Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recipe.tools.map(
                (tool, index) =>
                  tool && (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-sm"
                    >
                      <UtensilsCrossed className="size-3" />
                      {tool}
                    </span>
                  )
              )}
            </div>
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

      {/* Streaming indicator at the bottom */}
      {isStreaming && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="size-2 animate-pulse rounded-full bg-primary" />
          <span>Generating recipe...</span>
        </div>
      )}
    </div>
  );
}
