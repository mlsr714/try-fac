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
  refinementText: z.string().optional(),
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

// Full recipe schema for Step 4 generation
export const ingredientSchema = z.object({
  name: z.string().describe("Ingredient name"),
  amount: z.string().describe("Quantity (e.g. '2', '1/2')"),
  unit: z.string().describe("Unit of measurement (e.g. 'cups', 'tbsp', 'g')"),
});

export const instructionSchema = z.object({
  step: z.number().describe("Step number"),
  text: z.string().describe("Instruction text"),
});

export const nutritionSchema = z.object({
  calories: z.number().describe("Calories per serving"),
  protein: z.number().describe("Protein in grams per serving"),
  carbs: z.number().describe("Carbohydrates in grams per serving"),
  fat: z.number().describe("Fat in grams per serving"),
});

export const thermomixInstructionSchema = z.object({
  step: z.number().describe("Step number"),
  text: z.string().describe("Instruction text"),
  speed: z.string().describe("Thermomix speed setting (e.g. 'Speed 4', 'Turbo')"),
  temperature: z.string().describe("Temperature setting (e.g. '100°C', 'Varoma')"),
  time: z.string().describe("Duration (e.g. '5 min', '30 sec')"),
  bowl: z.string().describe("Bowl/accessory (e.g. 'Main bowl', 'Simmering basket')"),
});

export const fullRecipeSchema = z.object({
  title: z.string().describe("Recipe title"),
  summary: z.string().describe("Short summary of the recipe (1-2 sentences)"),
  servings: z.number().describe("Number of servings"),
  activeTime: z.string().describe("Active cooking time (e.g. '25 min')"),
  totalTime: z.string().describe("Total time including passive time (e.g. '45 min')"),
  ingredients: z.array(ingredientSchema).describe("List of ingredients"),
  instructions: z.array(instructionSchema).describe("Step-by-step cooking instructions"),
  nutrition: nutritionSchema.describe("Estimated nutrition per serving"),
  tools: z.array(z.string()).describe("Required cooking tools and equipment"),
  thermomixInstructions: z
    .nullable(z.array(thermomixInstructionSchema))
    .describe(
      "Thermomix-specific instructions if applicable. Null if the recipe doesn't benefit from Thermomix."
    ),
});

export type FullRecipe = z.infer<typeof fullRecipeSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;
export type Instruction = z.infer<typeof instructionSchema>;
export type Nutrition = z.infer<typeof nutritionSchema>;
export type ThermomixInstruction = z.infer<typeof thermomixInstructionSchema>;

// Request schema for the recipe generation API
export const generateRecipeRequestSchema = z.object({
  idea: recipeIdeaSchema,
  constraints: constraintFormSchema,
});
