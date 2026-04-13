import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { syncUser } from "@/actions/sync-user";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sparkles,
  ArrowRightLeft,
  BookOpen,
  Refrigerator,
} from "lucide-react";

const quickActions = [
  {
    href: "/generate",
    title: "Generate Recipe",
    description:
      "Create personalized recipes powered by AI based on your preferences, dietary needs, and available time.",
    icon: Sparkles,
  },
  {
    href: "/convert",
    title: "Convert Recipe",
    description:
      "Transform any recipe into Thermomix-compatible instructions with precise speed, temperature, and timing.",
    icon: ArrowRightLeft,
  },
  {
    href: "/recipes",
    title: "My Recipes",
    description:
      "Browse and manage your saved recipes — both generated and converted — all in one place.",
    icon: BookOpen,
  },
  {
    href: "/pantry",
    title: "My Pantry",
    description:
      "Manage your kitchen ingredients so the AI can suggest recipes based on what you already have.",
    icon: Refrigerator,
  },
];

export default async function DashboardPage() {
  const [user] = await Promise.all([currentUser(), syncUser()]);

  const firstName = user?.firstName || null;
  const greeting = firstName
    ? `Welcome back, ${firstName}!`
    : "Welcome back!";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
      <p className="mt-2 text-muted-foreground">
        What would you like to do today?
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group block transition-transform hover:scale-[1.02]"
          >
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardHeader>
                <action.icon className="mb-2 size-8 text-primary" />
                <CardTitle>{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
