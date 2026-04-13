"use client";

import { useState, useEffect, useCallback } from "react";
import { ConstraintForm } from "@/components/constraint-form";
import { IdeaCards } from "@/components/idea-cards";
import { RecipeStream } from "@/components/recipe-stream";
import type {
  GenerateIdeasResponse,
  RecipeIdea,
  ConstraintFormValues,
} from "@/lib/schemas/generation";

type WizardStep = 1 | 2 | 4;

export default function GeneratePage() {
  const [step, setStep] = useState<WizardStep>(1);
  const [ideas, setIdeas] = useState<GenerateIdeasResponse | null>(null);
  const [constraints, setConstraints] = useState<ConstraintFormValues | null>(
    null
  );
  const [selectedIdea, setSelectedIdea] = useState<RecipeIdea | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  // Set initial history state on mount
  useEffect(() => {
    if (!window.history.state?.wizardStep) {
      window.history.replaceState({ wizardStep: 1 }, "");
    }
  }, []);

  // Handle browser back/forward navigation
  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const prevStep = event.state?.wizardStep as WizardStep | undefined;
      if (prevStep) {
        setStep(prevStep);
        // If going back from step 4 to step 2, clear selected idea
        if (prevStep === 2) {
          setSelectedIdea(null);
        }
      } else {
        // If no wizard state, we're going back before the wizard started
        setStep(1);
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToStep = useCallback((newStep: WizardStep) => {
    window.history.pushState({ wizardStep: newStep }, "");
    setStep(newStep);
  }, []);

  function handleIdeasGenerated(
    data: GenerateIdeasResponse,
    formValues: ConstraintFormValues
  ) {
    setIdeas(data);
    setConstraints(formValues);
    navigateToStep(2);
  }

  function handleSelectIdea(idea: RecipeIdea) {
    setSelectedIdea(idea);
    navigateToStep(4);
  }

  async function handleRefine(refinementText: string) {
    if (!constraints) return;

    setIsRefining(true);

    try {
      const response = await fetch("/api/generate/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...constraints,
          refinementText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to refine ideas");
      }

      const data = (await response.json()) as GenerateIdeasResponse;
      setIdeas(data);
    } catch {
      // Error handling — ideas remain unchanged on failure
    } finally {
      setIsRefining(false);
    }
  }

  const stepDescriptions: Record<WizardStep, string> = {
    1: "Define your preferences and constraints to generate personalized recipe ideas.",
    2: "Choose a recipe idea to generate a full recipe, or refine your options.",
    4: "Your recipe is being generated. Watch it come together in real time!",
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Generate Recipe</h1>
      <p className="mt-2 text-muted-foreground">{stepDescriptions[step]}</p>
      <div className="mt-8">
        {step === 1 && (
          <div className="mx-auto max-w-2xl">
            <ConstraintForm
              onSuccess={handleIdeasGenerated}
              initialValues={constraints ?? undefined}
            />
          </div>
        )}
        {step === 2 && ideas && (
          <IdeaCards
            ideas={ideas.ideas}
            onSelect={handleSelectIdea}
            onRefine={handleRefine}
            isRefining={isRefining}
          />
        )}
        {step === 4 && selectedIdea && constraints && (
          <RecipeStream idea={selectedIdea} constraints={constraints} />
        )}
      </div>
    </div>
  );
}
