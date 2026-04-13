import { NextResponse } from "next/server";
import { constraintFormSchema } from "@/lib/schemas/generation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = constraintFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid constraints", details: result.error.issues },
        { status: 400 }
      );
    }

    // Mock response — will be connected to AI in the next feature
    const mockIdeas = {
      ideas: [
        {
          title: `${result.data.diet} ${result.data.mealType} Bowl`,
          description: `A delicious ${result.data.difficulty.toLowerCase()}-level ${result.data.mealType.toLowerCase()} that fits your dietary preferences. Ready in under ${result.data.maxCookingTime} minutes.`,
          estimatedTime: `${result.data.maxCookingTime} min`,
          tools: ["Mixing bowl", "Skillet"],
        },
        {
          title: `Quick ${result.data.mealType} Delight`,
          description: `A crowd-pleasing ${result.data.mealType.toLowerCase()} for ${result.data.servings} people. Simple ingredients, amazing flavor.`,
          estimatedTime: `${Math.max(15, result.data.maxCookingTime - 10)} min`,
          tools: ["Cutting board", "Saucepan"],
        },
        {
          title: `Chef's ${result.data.difficulty} ${result.data.mealType}`,
          description: `An impressive ${result.data.diet.toLowerCase()} dish that showcases your cooking skills with minimal effort.`,
          estimatedTime: `${Math.max(10, result.data.maxCookingTime - 5)} min`,
          tools: ["Baking sheet", "Chef's knife"],
        },
      ],
    };

    return NextResponse.json(mockIdeas);
  } catch {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
