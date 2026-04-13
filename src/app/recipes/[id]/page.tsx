import { notFound } from "next/navigation";
import { getRecipe } from "@/actions/get-recipe";
import { RecipeDetailView } from "@/components/recipe-detail-view";

interface RecipeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const { id } = await params;
  const result = await getRecipe(id);

  if ("error" in result) {
    if (result.error === "Recipe not found") {
      notFound();
    }
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <p className="text-destructive">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <RecipeDetailView recipe={result.recipe} />
    </div>
  );
}
