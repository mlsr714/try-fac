"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { ConstraintForm } from "@/components/constraint-form";
import { IdeaCards } from "@/components/idea-cards";
import { RecipeStream } from "@/components/recipe-stream";
import { generateIdeasResponseSchema } from "@/lib/schemas/generation";
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
  // Key to force re-render of child components on wizard reset
  const [wizardKey, setWizardKey] = useState(0);
  const isInitialMount = useRef(true);
  const pendingConstraints = useRef<ConstraintFormValues | null>(null);

  const { object: streamedIdeas, submit: submitIdeas, isLoading: isStreamingIdeas, stop: stopIdeas } = useObject({
    api: "/api/generate/ideas",
    schema: generateIdeasResponseSchema,
    onFinish: ({ object: finishedObject }) => {
      if (finishedObject) {
        setIdeas(finishedObject);
        setIsRefining(false);
      }
    },
    onError: () => {
      setIsRefining(false);
    },
  });

  // Set initial history state on mount — wizard already starts at clean state
  // via useState defaults (step=1, ideas=null, etc.) so no setState needed.
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
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
        setIdeas(null);
        setConstraints(null);
        setSelectedIdea(null);
        setIsRefining(false);
        setWizardKey((k) => k + 1);
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Stop streaming on unmount to prevent stale data
  useEffect(() => {
    return () => {
      stopIdeas();
    };
  }, [stopIdeas]);

  const navigateToStep = useCallback((newStep: WizardStep) => {
    window.history.pushState({ wizardStep: newStep }, "");
    setStep(newStep);
  }, []);

  function handleConstraintSubmit(formValues: ConstraintFormValues) {
    setConstraints(formValues);
    pendingConstraints.current = formValues;
    navigateToStep(2);
    submitIdeas(formValues);
  }

  function handleSelectIdea(idea: RecipeIdea) {
    setSelectedIdea(idea);
    navigateToStep(4);
  }

  function handleRefine(refinementText: string) {
    if (!constraints) return;

    setIsRefining(true);

    const refinedConstraints = {
      ...constraints,
      refinementText,
    };

    submitIdeas(refinedConstraints);
  }

  // Use streamed ideas while loading, fall back to finalized ideas
  const displayIdeas = isStreamingIdeas && streamedIdeas?.ideas
    ? streamedIdeas.ideas.filter((idea): idea is RecipeIdea =>
        idea != null &&
        typeof idea.title === "string" &&
        typeof idea.description === "string" &&
        typeof idea.estimatedTime === "string" &&
        Array.isArray(idea.tools)
      )
    : ideas?.ideas ?? [];

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
              onSubmit={handleConstraintSubmit}
              initialValues={constraints ?? undefined}
              isSubmitting={isStreamingIdeas}
            />
          </div>
        )}
        {step === 2 && (
          <IdeaCards
            ideas={displayIdeas}
            onSelect={handleSelectIdea}
            onRefine={handleRefine}
            isRefining={isRefining || isStreamingIdeas}
            disabled={isStreamingIdeas}
          />
        )}
        {step === 4 && selectedIdea && constraints && (
          <RecipeStream key={wizardKey} idea={selectedIdea} constraints={constraints} />
        )}
      </div>
    </div>
  );
}
