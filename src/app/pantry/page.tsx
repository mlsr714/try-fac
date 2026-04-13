import { getPantryItems } from "@/actions/get-pantry-items";
import { PantryList } from "@/components/pantry-list";

export default async function PantryPage() {
  const result = await getPantryItems();

  if ("error" in result) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">My Pantry</h1>
        <p className="mt-4 text-destructive">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">My Pantry</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your kitchen ingredients. These can be used when generating
        recipes.
      </p>
      <div className="mt-8">
        <PantryList initialItems={result.items} />
      </div>
    </div>
  );
}
