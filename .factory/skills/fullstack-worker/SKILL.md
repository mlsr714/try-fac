---
name: fullstack-worker
description: Full-stack Next.js worker for UI, API routes, server actions, and database work
---

# Full-Stack Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Features involving Next.js pages, components, API route handlers, server actions, Drizzle ORM schema/queries, AI integration, or any combination of frontend + backend work.

## Required Skills

- `agent-browser` — For manual verification of UI features. Invoke after implementation to verify pages render correctly and user flows work.

## Work Procedure

### 1. Understand the Feature

Read the feature description, preconditions, expectedBehavior, and verificationSteps carefully. Read `AGENTS.md` for mission boundaries and conventions. Read `.factory/library/architecture.md` for system context. Read `.factory/library/environment.md` for env var and dependency details.

### 2. Check Preconditions

Verify all preconditions listed in the feature are met. If a precondition depends on another feature's work, check that the code/schema/routes exist. If preconditions are NOT met, return to orchestrator.

### 3. Write Tests First (TDD)

Write failing tests BEFORE implementing:
- For API routes: test the route handler with mock requests
- For server actions: test the action function with expected inputs/outputs  
- For DB queries: test query functions with expected results
- For components: test rendering and user interactions with React Testing Library
- Place tests next to the code: `foo.test.ts` next to `foo.ts`, or in `__tests__/` directories
- Use Vitest as the test runner
- Run `npx vitest run --reporter=verbose` to confirm tests fail (red phase)

### 4. Implement

Write the implementation to make tests pass:
- Follow existing code patterns (check nearby files for style)
- Use shadcn/ui components for UI (install new ones with `npx shadcn@latest add <component>`)
- Use Drizzle ORM for all database operations
- Use Vercel AI SDK v6 patterns for AI features (see `.factory/library/environment.md` for gotchas)
- Server-side only: DB client, AI Gateway key, Clerk secret key
- Client-side: React hooks, shadcn/ui, Clerk components

### 5. Run Tests (Green Phase)

Run `npx vitest run --reporter=verbose` and fix until all tests pass.

### 6. Run Validators

Run all three:
```bash
npx tsc --noEmit          # Typecheck
npx eslint .              # Lint
npx vitest run            # Tests
```
Fix any failures before proceeding.

### 7. Manual Verification with agent-browser

Start the dev server if not running: `npm run dev -- -p 3100 &`

Invoke the `agent-browser` skill to verify:
- Page renders correctly at the expected URL
- User interactions work as described in the feature's expectedBehavior
- No visual glitches, broken layouts, or missing content
- Forms submit correctly, data persists, navigation works

Document each check in your handoff's `interactiveChecks`.

### 8. Clean Up

- Stop any processes you started (dev server, etc.)
- Ensure no watch-mode processes are left running
- Commit your work with a descriptive message

## Example Handoff

```json
{
  "salientSummary": "Implemented the recipe generation constraint form (Step 1) with diet, meal type, difficulty, cooking time, servings, optional ingredients, and pantry toggle. Wrote 6 Vitest tests covering form rendering, validation (invalid servings), and submission. Verified with agent-browser: form renders all fields, validation errors show for invalid input, and form submits with loading state.",
  "whatWasImplemented": "Created /app/generate/page.tsx with multi-field constraint form using shadcn/ui Select, Input, Textarea, and Switch components. Added Zod schema for form validation in /lib/schemas/generation.ts. Created /app/api/generate/ideas/route.ts POST handler that accepts constraints and returns 3 recipe ideas via AI Gateway streaming.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "npx vitest run --reporter=verbose", "exitCode": 0, "observation": "6 tests passing: form renders all fields, diet options present, servings rejects zero, servings rejects negative, form submits with valid data, pantry toggle works" },
      { "command": "npx tsc --noEmit", "exitCode": 0, "observation": "No type errors" },
      { "command": "npx next lint", "exitCode": 0, "observation": "No lint warnings" }
    ],
    "interactiveChecks": [
      { "action": "Navigated to http://localhost:3100/generate", "observed": "Constraint form renders with all 7 fields: diet dropdown, meal type dropdown, difficulty dropdown, cooking time input, servings input, ingredients textarea, pantry toggle" },
      { "action": "Selected 'Vegan' diet, 'Dinner' meal type, 'Easy' difficulty, entered 30 min cooking time, 4 servings", "observed": "All selections persist, form shows no validation errors" },
      { "action": "Entered 0 in servings and clicked submit", "observed": "Red validation error appears below servings field: 'Servings must be at least 1'" },
      { "action": "Fixed servings to 4 and clicked submit", "observed": "Submit button shows loading spinner, form fields disabled during submission" }
    ]
  },
  "tests": {
    "added": [
      {
        "file": "app/generate/__tests__/constraint-form.test.tsx",
        "cases": [
          { "name": "renders all constraint fields", "verifies": "All 7 form fields are present in the DOM" },
          { "name": "diet selector shows options", "verifies": "Diet dropdown contains expected diet options" },
          { "name": "rejects zero servings", "verifies": "Form validation prevents submission with 0 servings" },
          { "name": "rejects negative servings", "verifies": "Form validation prevents submission with negative servings" },
          { "name": "submits with valid data", "verifies": "Form POSTs to /api/generate/ideas with correct payload" },
          { "name": "pantry toggle is functional", "verifies": "Toggle switches between on/off states" }
        ]
      }
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Database schema needed but not yet created (dependency on earlier feature)
- API endpoint needed that doesn't exist yet
- Clerk configuration issue preventing auth from working
- AI Gateway returning errors that suggest credential/configuration problems
- Supabase connection failing (DB unreachable)
- Requirements are ambiguous or contradictory
- Feature scope is significantly larger than described
