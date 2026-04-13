"use client";

import { Clock, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  onRefine: () => void;
  disabled?: boolean;
}

export function IdeaCards({
  ideas,
  onSelect,
  onRefine,
  disabled = false,
}: IdeaCardsProps) {
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
                disabled={disabled}
              >
                Select
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="flex justify-center">
        <Button variant="outline" onClick={onRefine} disabled={disabled}>
          Refine
        </Button>
      </div>
    </div>
  );
}
