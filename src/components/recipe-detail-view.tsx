"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Timer,
  Users,
  UtensilsCrossed,
  Flame,
  Beef,
  Wheat,
  Droplets,
  ArrowLeft,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteRecipe } from "@/actions/delete-recipe";
import type { RecipeDetail } from "@/actions/get-recipe";

// Type helpers for JSON fields
type Ingredient = { name: string; amount: string; unit: string };
type Instruction = { step: number; text: string };
type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};
type ThermomixInstruction = {
  step: number;
  text: string;
  speed?: string;
  temperature?: string;
  time?: string;
  bowl?: string;
  accessories?: string;
};

interface RecipeDetailViewProps {
  recipe: RecipeDetail;
}

export function RecipeDetailView({ recipe }: RecipeDetailViewProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const ingredients = (recipe.ingredients as Ingredient[] | null) ?? [];
  const instructions = (recipe.instructions as Instruction[] | null) ?? [];
  const nutrition = recipe.nutrition as Nutrition | null;
  const tools = (recipe.tools as string[] | null) ?? [];
  const thermomixInstructions =
    (recipe.thermomixInstructions as ThermomixInstruction[] | null) ?? null;

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteRecipe(recipe.id);

    if ("success" in result) {
      router.push("/recipes");
    } else {
      setDeleteError(result.error);
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back navigation and actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          data-testid="back-link"
        >
          <ArrowLeft className="size-4" />
          Back to Recipes
        </Link>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                size="sm"
                data-testid="delete-button"
              />
            }
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{recipe.title}
                &rdquo;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="cancel-delete">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                variant="destructive"
                data-testid="confirm-delete"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Delete error */}
      {deleteError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">Error: {deleteError}</p>
        </div>
      )}

      {/* Title and summary */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="recipe-title">
          {recipe.title}
        </h1>
        {recipe.summary && (
          <p className="mt-2 text-muted-foreground" data-testid="recipe-summary">
            {recipe.summary}
          </p>
        )}
      </div>

      {/* Metadata: Servings, Active Time, Total Time */}
      {(recipe.servings || recipe.activeTime || recipe.totalTime) && (
        <div className="flex flex-wrap gap-4" data-testid="recipe-meta">
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
      {ingredients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2" data-testid="ingredients-list">
              {ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-baseline gap-2">
                  <span className="font-medium">
                    {ingredient.amount}
                    {ingredient.unit ? ` ${ingredient.unit}` : ""}
                  </span>
                  <span>{ingredient.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {instructions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4" data-testid="instructions-list">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    {instruction.step ?? index + 1}
                  </span>
                  <p className="pt-0.5">{instruction.text}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Nutrition */}
      {nutrition && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nutrition (per serving)</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="grid grid-cols-2 gap-4 sm:grid-cols-4"
              data-testid="nutrition-info"
            >
              {nutrition.calories !== undefined && (
                <div className="flex items-center gap-2">
                  <Flame className="size-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">{nutrition.calories}</p>
                    <p className="text-xs text-muted-foreground">Calories</p>
                  </div>
                </div>
              )}
              {nutrition.protein !== undefined && (
                <div className="flex items-center gap-2">
                  <Beef className="size-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">{nutrition.protein}g</p>
                    <p className="text-xs text-muted-foreground">Protein</p>
                  </div>
                </div>
              )}
              {nutrition.carbs !== undefined && (
                <div className="flex items-center gap-2">
                  <Wheat className="size-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">{nutrition.carbs}g</p>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                  </div>
                </div>
              )}
              {nutrition.fat !== undefined && (
                <div className="flex items-center gap-2">
                  <Droplets className="size-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">{nutrition.fat}g</p>
                    <p className="text-xs text-muted-foreground">Fat</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tools */}
      {tools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Required Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2" data-testid="tools-list">
              {tools.map((tool, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-sm"
                >
                  <UtensilsCrossed className="size-3" />
                  {tool}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Thermomix Instructions - only shown when present */}
      {thermomixInstructions && thermomixInstructions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-lg">
              🤖 Thermomix Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4" data-testid="thermomix-instructions">
              {thermomixInstructions.map((instruction, index) => (
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
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
