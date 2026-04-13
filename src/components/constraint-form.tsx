"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  constraintFormSchema,
  dietOptions,
  mealTypeOptions,
  difficultyOptions,
  type ConstraintFormValues,
  type GenerateIdeasResponse,
} from "@/lib/schemas/generation";

interface ConstraintFormProps {
  onSuccess?: (data: GenerateIdeasResponse, constraints: ConstraintFormValues) => void;
  initialValues?: Partial<ConstraintFormValues>;
}

interface FieldErrors {
  diet?: string;
  mealType?: string;
  difficulty?: string;
  maxCookingTime?: string;
  servings?: string;
}

export function ConstraintForm({ onSuccess, initialValues }: ConstraintFormProps) {
  const [diet, setDiet] = useState<string>(initialValues?.diet ?? dietOptions[0]);
  const [mealType, setMealType] = useState<string>(initialValues?.mealType ?? mealTypeOptions[0]);
  const [difficulty, setDifficulty] = useState<string>(initialValues?.difficulty ?? difficultyOptions[0]);
  const [maxCookingTime, setMaxCookingTime] = useState(
    initialValues?.maxCookingTime != null ? String(initialValues.maxCookingTime) : ""
  );
  const [servings, setServings] = useState(
    initialValues?.servings != null ? String(initialValues.servings) : ""
  );
  const [ingredients, setIngredients] = useState(initialValues?.ingredients ?? "");
  const [additionalInstructions, setAdditionalInstructions] = useState(
    initialValues?.additionalInstructions ?? ""
  );
  const [includePantryItems, setIncludePantryItems] = useState(
    initialValues?.includePantryItems ?? false
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isSubmitting) return;

    // Clear previous errors
    setErrors({});

    // Parse number fields
    const cookingTimeNum = maxCookingTime === "" ? undefined : Number(maxCookingTime);
    const servingsNum = servings === "" ? undefined : Number(servings);

    // Handle NaN from non-numeric input
    const rawData = {
      diet,
      mealType,
      difficulty,
      maxCookingTime:
        cookingTimeNum !== undefined && !Number.isNaN(cookingTimeNum)
          ? cookingTimeNum
          : undefined,
      servings:
        servingsNum !== undefined && !Number.isNaN(servingsNum)
          ? servingsNum
          : undefined,
      ingredients,
      additionalInstructions,
      includePantryItems,
    };

    const result = constraintFormSchema.safeParse(rawData);

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }

      // Handle missing/NaN number fields
      if (maxCookingTime === "" || Number.isNaN(Number(maxCookingTime))) {
        if (!fieldErrors.maxCookingTime) {
          fieldErrors.maxCookingTime = "Cooking time is required";
        }
      }
      if (servings === "" || Number.isNaN(Number(servings))) {
        if (!fieldErrors.servings) {
          fieldErrors.servings = "Servings is required";
        }
      }

      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/generate/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!response.ok) {
        throw new Error("Failed to generate ideas");
      }

      const data = (await response.json()) as GenerateIdeasResponse;
      onSuccess?.(data, result.data);
    } catch {
      // Could show a toast here, but for now just re-enable the button
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Diet Selector */}
      <div className="space-y-2">
        <Label htmlFor="diet">Diet</Label>
        <Select value={diet} onValueChange={(v) => v && setDiet(v)}>
          <SelectTrigger id="diet" className="w-full">
            <SelectValue placeholder="Select diet" />
          </SelectTrigger>
          <SelectContent>
            {dietOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.diet && (
          <p className="text-sm text-destructive">{errors.diet}</p>
        )}
      </div>

      {/* Meal Type Selector */}
      <div className="space-y-2">
        <Label htmlFor="mealType">Meal Type</Label>
        <Select value={mealType} onValueChange={(v) => v && setMealType(v)}>
          <SelectTrigger id="mealType" className="w-full">
            <SelectValue placeholder="Select meal type" />
          </SelectTrigger>
          <SelectContent>
            {mealTypeOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.mealType && (
          <p className="text-sm text-destructive">{errors.mealType}</p>
        )}
      </div>

      {/* Difficulty Selector */}
      <div className="space-y-2">
        <Label htmlFor="difficulty">Difficulty</Label>
        <Select value={difficulty} onValueChange={(v) => v && setDifficulty(v)}>
          <SelectTrigger id="difficulty" className="w-full">
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            {difficultyOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.difficulty && (
          <p className="text-sm text-destructive">{errors.difficulty}</p>
        )}
      </div>

      {/* Max Active Cooking Time */}
      <div className="space-y-2">
        <Label htmlFor="maxCookingTime">Max Active Cooking Time (minutes)</Label>
        <Input
          id="maxCookingTime"
          type="number"
          placeholder="e.g. 30"
          value={maxCookingTime}
          onChange={(e) => setMaxCookingTime(e.target.value)}
          aria-invalid={!!errors.maxCookingTime}
          disabled={isSubmitting}
        />
        {errors.maxCookingTime && (
          <p className="text-sm text-destructive">{errors.maxCookingTime}</p>
        )}
      </div>

      {/* Servings */}
      <div className="space-y-2">
        <Label htmlFor="servings">Servings</Label>
        <Input
          id="servings"
          type="number"
          placeholder="e.g. 4"
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          aria-invalid={!!errors.servings}
          disabled={isSubmitting}
        />
        {errors.servings && (
          <p className="text-sm text-destructive">{errors.servings}</p>
        )}
      </div>

      {/* Optional Ingredients */}
      <div className="space-y-2">
        <Label htmlFor="ingredients">
          Ingredients (optional, comma-separated)
        </Label>
        <Textarea
          id="ingredients"
          placeholder="e.g. chicken, rice, broccoli"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {/* Optional Additional Instructions */}
      <div className="space-y-2">
        <Label htmlFor="additionalInstructions">
          Additional Instructions (optional)
        </Label>
        <Textarea
          id="additionalInstructions"
          placeholder="e.g. Make it kid-friendly and avoid cilantro"
          value={additionalInstructions}
          onChange={(e) => setAdditionalInstructions(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {/* Include Pantry Items Toggle */}
      <div className="flex items-center gap-3">
        <Switch
          id="includePantryItems"
          checked={includePantryItems}
          onCheckedChange={setIncludePantryItems}
          disabled={isSubmitting}
        />
        <Label htmlFor="includePantryItems">Include pantry items</Label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Ideas"
        )}
      </Button>
    </form>
  );
}
