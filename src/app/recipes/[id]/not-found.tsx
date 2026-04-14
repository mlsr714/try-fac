import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RecipeNotFound() {
  return (
    <div className="container mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <FileQuestion className="mb-6 size-16 text-muted-foreground/50" />
      <h1 className="text-2xl font-bold tracking-tight">Recipe Not Found</h1>
      <p className="mt-2 text-muted-foreground">
        This recipe may have been deleted or doesn&apos;t exist.
      </p>
      <Link
        href="/recipes"
        className={cn(buttonVariants(), "mt-6")}
      >
        Back to Recipes
      </Link>
    </div>
  );
}
