# RecipeForge

RecipeForge is an AI-assisted recipe app built with the Next.js App Router. Authenticated users can generate tailored recipes, convert free-form recipes into Thermomix-compatible steps, save recipes, and manage pantry items that feed future recipe generation.

## Tech stack

- Next.js `16.2.3` + React `19`
- Clerk for authentication
- Supabase Postgres + Drizzle ORM
- Vercel AI Gateway + AI SDK v6
- Tailwind CSS 4 + shadcn/ui + Base UI
- TypeScript, ESLint, Vitest, Testing Library

## Prerequisites

Before you start, make sure you have:

- Node.js and npm installed
- A Clerk application for auth keys
- A Supabase Postgres database
- A Vercel AI Gateway API key

## Environment variables

Create a `.env.local` file in the repo root with placeholder values like these:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_REPLACE_ME
CLERK_SECRET_KEY=sk_test_REPLACE_ME
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
DATABASE_URL=YOUR_SUPABASE_DATABASE_URL_HERE
AI_GATEWAY_API_KEY=vck_REPLACE_ME
```

Notes:

- `DATABASE_URL` should be the Supabase pooler connection string on port `6543`.
- The Drizzle config reads `.env.local` directly.

## Install and run locally

```bash
npm install
npm run dev -- -p 3100
```

Open `http://localhost:3100`.

## Database setup

The schema lives in `src/db/schema.ts`, and generated Drizzle artifacts live in `drizzle/`.

```bash
npm run db:generate
npm run db:push
```

- `npm run db:generate` refreshes Drizzle artifacts from the current schema
- `npm run db:push` applies the schema to the database configured in `.env.local`

## Validation commands

Use these before opening a PR:

```bash
npm run test
npm run lint
npx tsc --noEmit
npm run build
```

There is no dedicated `typecheck` script in `package.json`; use `npx tsc --noEmit`.

## Project structure

```text
src/app/                  App Router pages, layouts, and route handlers
src/app/api/**/route.ts   AI endpoints for generation and conversion
src/actions/              Server actions for reads, writes, and revalidation
src/components/           Feature components and shared UI primitives
src/lib/schemas/          Zod schemas shared by forms and AI output
src/db/                   Drizzle client and database schema
drizzle/                  Generated Drizzle artifacts
```

## Where to add new features

- **New pages/routes:** add `page.tsx` files under `src/app/...`
- **New authenticated pages:** make sure the route is protected in `middleware.ts`
- **Reusable UI or feature components:** add to `src/components`
- **Mutations / server-side reads:** add server actions in `src/actions`
- **Streaming AI endpoints:** add route handlers in `src/app/api/.../route.ts`
- **Validation and AI contracts:** update or add Zod schemas in `src/lib/schemas`
- **Database changes:** update `src/db/schema.ts`, then run `npm run db:generate` and `npm run db:push`

## Development guidelines and gotchas

- This app uses Clerk for auth, not Supabase Auth.
- There is **no database RLS** here; every query must be scoped by Clerk `userId`.
- Call `syncUser()` before inserts into user-owned tables to avoid first-use foreign key failures.
- Keep `postgres(..., { prepare: false })` when working with Supabase pooler connections.
- `auth()` from Clerk and `cookies()` in modern Next.js are async; always `await` them.
- AI routes use `gateway("openai/gpt-4o")` from the `ai` package and Zod schemas for structured output.
- AI SDK v6 uses UI message `parts[]` rather than a single `content` string.
- This codebase's Base UI / shadcn composition often uses `render` props instead of Radix-style `asChild`.

## Clerk headless-browser note

In this environment, Clerk sign-in/sign-up can stall in headless browser automation because of Cloudflare / Private Access Token challenges. If authenticated E2E automation gets stuck, verify the auth flow in a normal browser session before treating it as an app regression.
