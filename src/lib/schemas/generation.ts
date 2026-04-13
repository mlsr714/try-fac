import { z } from "zod";

export const dietOptions = [
  "No Restriction",
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Keto",
  "Paleo",
  "Dairy-Free",
] as const;

export const mealTypeOptions = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Dessert",
] as const;

export const difficultyOptions = ["Easy", "Medium", "Hard"] as const;

export const constraintFormSchema = z.object({
  diet: z.enum(dietOptions),
  mealType: z.enum(mealTypeOptions),
  difficulty: z.enum(difficultyOptions),
  maxCookingTime: z
    .number({ error: "Cooking time is required" })
    .int("Cooking time must be a whole number")
    .positive("Cooking time must be greater than 0"),
  servings: z
    .number({ error: "Servings is required" })
    .int("Servings must be a whole number")
    .positive("Servings must be at least 1"),
  ingredients: z.string().optional().default(""),
  additionalInstructions: z.string().optional().default(""),
  includePantryItems: z.boolean().default(false),
});

export type ConstraintFormValues = z.infer<typeof constraintFormSchema>;

export const recipeIdeaSchema = z.object({
  title: z.string(),
  description: z.string(),
  estimatedTime: z.string(),
  tools: z.array(z.string()),
});

export const generateIdeasResponseSchema = z.object({
  ideas: z.array(recipeIdeaSchema).length(3),
});

export type RecipeIdea = z.infer<typeof recipeIdeaSchema>;
export type GenerateIdeasResponse = z.infer<typeof generateIdeasResponseSchema>;
