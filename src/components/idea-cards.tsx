"use client";

import { useState } from "react";
import { Clock, Wrench, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RecipeIdea } from "@/lib/schemas/generation";

interface IdeaCardsProps {
  ideas: RecipeIdea[];
  onSelect: (idea: RecipeIdea) => void;
  onRefine: (refinementText: string) => void;
  disabled?: boolean;
  isRefining?: boolean;
}

export function IdeaCards({
  ideas,
  onSelect,
  onRefine,
  disabled = false,
  isRefining = false,
}: IdeaCardsProps) {
  const [showRefinementInput, setShowRefinementInput] = useState(false);
  const [refinementText, setRefinementText] = useState("");
  const [refinementError, setRefinementError] = useState("");

  function handleRefineClick() {
    setShowRefinementInput(true);
  }

  function handleRefinementSubmit() {
    const trimmed = refinementText.trim();
    if (!trimmed) {
      setRefinementError("Please enter refinement instructions");
      return;
    }
    setRefinementError("");
    onRefine(trimmed);
    // After submitting, reset the input for next refinement
    setRefinementText("");
    setShowRefinementInput(false);
  }

  function handleCancelRefinement() {
    setShowRefinementInput(false);
    setRefinementText("");
    setRefinementError("");
  }

  const isDisabled = disabled || isRefining;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {ideas.map((idea, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{idea.title}</CardTitle>
              <CardDescription>{idea.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" />
                <span>{idea.estimatedTime}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Wrench className="mt-0.5 size-4 shrink-0" />
                <span>
                  {idea.tools.length > 0
                    ? idea.tools.join(", ")
                    : "No special tools"}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => onSelect(idea)}
                disabled={isDisabled}
              >
                Select
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {showRefinementInput ? (
        <div className="mx-auto max-w-lg space-y-3">
          <Textarea
            placeholder="e.g. Make it more Mediterranean"
            value={refinementText}
            onChange={(e) => {
              setRefinementText(e.target.value);
              if (refinementError) setRefinementError("");
            }}
            disabled={isRefining}
            aria-label="Refinement instructions"
          />
          {refinementError && (
            <p className="text-sm text-destructive">{refinementError}</p>
          )}
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={handleCancelRefinement}
              disabled={isRefining}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefinementSubmit}
              disabled={isRefining || refinementText.trim().length === 0}
            >
              {isRefining ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Refining...
                </>
              ) : (
                "Submit Refinement"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleRefineClick}
            disabled={isDisabled}
          >
            {isRefining ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Refining...
              </>
            ) : (
              "Refine"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
