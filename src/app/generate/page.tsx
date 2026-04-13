import { ConstraintForm } from "@/components/constraint-form";

export default function GeneratePage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Generate Recipe</h1>
      <p className="mt-2 text-muted-foreground">
        Define your preferences and constraints to generate personalized recipe
        ideas.
      </p>
      <div className="mt-8">
        <ConstraintForm />
      </div>
    </div>
  );
}
