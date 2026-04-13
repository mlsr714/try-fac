import { z } from "zod";

// Conversion input schema
export const convertRequestSchema = z.object({
  recipeText: z.string().min(1, "Recipe text is required"),
});

export type ConvertRequest = z.infer<typeof convertRequestSchema>;

// Conversion output schemas
export const convertIngredientSchema = z.object({
  name: z.string().describe("Ingredient name"),
  amount: z.string().describe("Quantity (e.g. '2', '1/2', 'a pinch')"),
  unit: z.string().describe("Unit of measurement (e.g. 'cups', 'tbsp', 'g', '')"),
});

export const convertStepSchema = z.object({
  step: z.number().describe("Step number"),
  text: z.string().describe("Instruction text"),
});

export const convertThermomixStepSchema = z.object({
  step: z.number().describe("Step number"),
  text: z.string().describe("Instruction text for Thermomix"),
  speed: z
    .string()
    .describe("Thermomix speed setting (e.g. 'Speed 1', 'Speed 4', 'Turbo', 'Stir/Reverse')"),
  temperature: z
    .string()
    .describe("Temperature setting (e.g. '100°C', 'Varoma', 'No heat')"),
  time: z.string().describe("Duration (e.g. '5 min', '30 sec')"),
  bowl: z
    .string()
    .describe(
      "Bowl/accessory configuration (e.g. 'Main bowl', 'Simmering basket', 'Varoma tray')"
    ),
  accessories: z
    .string()
    .describe(
      "Additional accessories (e.g. 'Butterfly whisk', 'Spatula', 'None')"
    ),
});

export const convertedRecipeSchema = z.object({
  title: z.string().describe("Recipe title derived from the input text"),
  ingredients: z
    .array(convertIngredientSchema)
    .describe("Structured list of ingredients with quantities and units"),
  steps: z
    .array(convertStepSchema)
    .describe("Normalized step-by-step cooking instructions"),
  thermomixInstructions: z
    .array(convertThermomixStepSchema)
    .describe(
      "Thermomix-specific instructions covering the full recipe workflow. Each step must include speed (Speed 1-10, Turbo, or Stir/Reverse), temperature (37°C-120°C, Varoma, or No heat), time, bowl configuration, and accessories."
    ),
  warnings: z
    .nullable(
      z
        .array(z.string())
        .describe(
          "Warnings about assumptions made during conversion (e.g. assumed quantities, temperatures, or times). Null if no assumptions were needed."
        )
    )
    .describe(
      "Null when the recipe is fully specified. Array of warning strings when the AI had to make assumptions."
    ),
});

export type ConvertedRecipe = z.infer<typeof convertedRecipeSchema>;
export type ConvertIngredient = z.infer<typeof convertIngredientSchema>;
export type ConvertStep = z.infer<typeof convertStepSchema>;
export type ConvertThermomixStep = z.infer<typeof convertThermomixStepSchema>;
