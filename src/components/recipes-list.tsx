"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, BookOpen, Sparkles, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { RecipeListItem } from "@/actions/get-recipes";

interface RecipesListProps {
  recipes: RecipeListItem[];
}

export function RecipesList({ recipes }: RecipesListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecipes = searchQuery.trim()
    ? recipes.filter((recipe) =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recipes;

  // Empty state: no recipes at all
  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center" data-testid="empty-state">
        <BookOpen className="mb-4 size-12 text-muted-foreground/50" />
        <h2 className="text-lg font-semibold">No recipes yet</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Get started by generating a new recipe or converting an existing one.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="size-4" />
            Generate Recipe
          </Link>
          <Link
            href="/convert"
            className="inline-flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <ArrowRightLeft className="size-4" />
            Convert Recipe
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search recipes by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="search-input"
        />
      </div>

      {/* No results state */}
      {filteredRecipes.length === 0 && searchQuery.trim() && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center" data-testid="no-results-state">
          <Search className="mb-4 size-10 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold">No results found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No recipes match &ldquo;{searchQuery}&rdquo;. Try a different search
            term.
          </p>
        </div>
      )}

      {/* Recipe cards */}
      {filteredRecipes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2" data-testid="recipes-grid">
          {filteredRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="group block transition-transform hover:scale-[1.01]"
            >
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">
                      {recipe.title}
                    </CardTitle>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {recipe.sourceType === "converted"
                        ? "Converted"
                        : "Generated"}
                    </span>
                  </div>
                  {recipe.summary && (
                    <CardDescription className="line-clamp-2">
                      {recipe.summary}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
