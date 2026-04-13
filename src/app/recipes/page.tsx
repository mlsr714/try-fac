import { getRecipes } from "@/actions/get-recipes";
import { RecipesList } from "@/components/recipes-list";

export default async function RecipesPage() {
  const result = await getRecipes();

  if ("error" in result) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">My Recipes</h1>
        <p className="mt-4 text-destructive">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">My Recipes</h1>
      <p className="mt-2 text-muted-foreground">
        Browse and manage your saved recipes.
      </p>
      <div className="mt-8">
        <RecipesList recipes={result.recipes} />
      </div>
    </div>
  );
}
