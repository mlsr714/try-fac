"use client";

import { useState } from "react";
import { ConstraintForm } from "@/components/constraint-form";
import { IdeaCards } from "@/components/idea-cards";
import type {
  GenerateIdeasResponse,
  RecipeIdea,
  ConstraintFormValues,
} from "@/lib/schemas/generation";

export default function GeneratePage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [ideas, setIdeas] = useState<GenerateIdeasResponse | null>(null);
  const [, setConstraints] = useState<ConstraintFormValues | null>(null);
  const [, setSelectedIdea] = useState<RecipeIdea | null>(null);

  function handleIdeasGenerated(
    data: GenerateIdeasResponse,
    formValues: ConstraintFormValues
  ) {
    setIdeas(data);
    setConstraints(formValues);
    setStep(2);
  }

  function handleSelectIdea(idea: RecipeIdea) {
    setSelectedIdea(idea);
    // Step 3/4 will be implemented in a future feature
  }

  function handleRefine() {
    // Refinement will be implemented in a future feature (generation-refinement)
    // For now this is a placeholder
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Generate Recipe</h1>
      <p className="mt-2 text-muted-foreground">
        {step === 1
          ? "Define your preferences and constraints to generate personalized recipe ideas."
          : "Choose a recipe idea to generate a full recipe, or refine your options."}
      </p>
      <div className="mt-8">
        {step === 1 && (
          <div className="mx-auto max-w-2xl">
            <ConstraintForm onSuccess={handleIdeasGenerated} />
          </div>
        )}
        {step === 2 && ideas && (
          <IdeaCards
            ideas={ideas.ideas}
            onSelect={handleSelectIdea}
            onRefine={handleRefine}
          />
        )}
      </div>
    </div>
  );
}
