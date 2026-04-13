import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChefHat, Sparkles, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <ChefHat className="size-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            RecipeForge
          </h1>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            Generate tailored recipes with AI, convert any recipe into
            Thermomix-compatible formats, and manage your kitchen pantry — all
            in one place.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/sign-up"
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full sm:w-auto"
              )}
            >
              Get Started
            </Link>
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto"
              )}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            What you can do
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Sparkles className="mb-2 size-6 text-primary" />
                <CardTitle>AI Recipe Generation</CardTitle>
                <CardDescription>
                  Tell us your dietary preferences, available time, and
                  ingredients — our AI creates personalized recipes just for you.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <UtensilsCrossed className="mb-2 size-6 text-primary" />
                <CardTitle>Thermomix Conversion</CardTitle>
                <CardDescription>
                  Paste any recipe and instantly convert it into structured
                  Thermomix-compatible instructions with speed, temperature, and
                  timing.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <ChefHat className="mb-2 size-6 text-primary" />
                <CardTitle>Kitchen Management</CardTitle>
                <CardDescription>
                  Save your favourite recipes, manage your pantry ingredients,
                  and let AI factor in what you already have at home.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
