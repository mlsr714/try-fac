# RecipeForge — Architecture

## Overview

RecipeForge is a full-stack web application that lets authenticated users generate, convert, and manage recipes using AI. It is built on Next.js with the App Router, backed by Supabase Postgres for persistence and OpenAI (via an AI Gateway) for generative features. Clerk provides authentication; authorization is enforced at the application layer.

> Version note: the mission target specified Next.js 15, but the current repository dependency is `next@16.2.3`. If strict major-version alignment is required in future scaffolds, pin `create-next-app` to the intended major instead of using `@latest`.

## System Components

### Client Layer

The frontend is a React 19 application rendered through Next.js App Router. UI is composed with Tailwind CSS and shadcn/ui components. Clerk's `ClerkProvider` wraps the app to supply auth context, and `UserButton` provides session controls.

Pages divide into **public** (landing, sign-in, sign-up) and **protected** (dashboard, generate, convert, recipes, pantry). Clerk middleware intercepts every request and gates access to protected routes before they reach the App Router.

### Authentication & Authorization

Clerk is the sole identity provider. There is no Supabase Auth and no Row-Level Security on the database. Instead, every database query includes a filter on the Clerk `userId`, enforcing tenant isolation at the application level. This is a deliberate trade-off: it simplifies the data layer at the cost of requiring disciplined query construction in server-side code.

A user-sync mechanism ensures the `users` table stays in step with Clerk: on the first authenticated request, a server action upserts the Clerk user record into Postgres.

For write actions that insert into user-foreign-key tables (`recipes`, `pantry_items`), call `syncUser()` before the insert to avoid first-use foreign-key failures when users access generation/conversion/pantry flows directly.

### Server Layer

Next.js serves two distinct server-side roles:

- **Server Components + Server Actions** — handle page rendering and database mutations (CRUD for recipes, pantry items, user sync). These interact with Postgres through Drizzle ORM.
- **Route Handlers** — expose streaming AI endpoints. These accept client requests, call the AI Gateway, and return streamed responses to the browser.

The separation keeps database concerns out of AI streaming paths and vice versa.

### Data Layer

Supabase Cloud Postgres is the single relational store, accessed exclusively through Drizzle ORM with the `postgres.js` driver (`prepare: false` for Supabase compatibility).

**Core entities:**

| Entity | Identity | Key relationships |
|---|---|---|
| User | Clerk user ID (text) | Owns recipes and pantry items |
| Recipe | UUID | Belongs to a user; stores ingredients, instructions, nutrition, and tools as JSONB; tracks source type (generated or converted) |
| Pantry Item | UUID | Belongs to a user |

JSONB columns give recipes a flexible inner structure without requiring join tables for nested data like ingredient lists, step-by-step instructions, or optional Thermomix adaptations.

### AI Layer

Recipe generation and conversion are powered by OpenAI's GPT-4o, accessed through an AI Gateway (`gateway('openai/gpt-4o')`). The gateway key is a server-side secret and never exposed to the client.

AI responses use **structured output** — Zod schemas define the expected shape, and the AI SDK's `Output.object()` guarantees the response conforms. The same Zod schemas are reused for form validation on the client, keeping the contract between AI output and application data consistent.

Streaming is handled by `streamText()` piped through `toUIMessageStreamResponse()`, delivering incremental results to the browser over a single HTTP connection.

## Data Flow

```
Browser
  │
  ▼
Clerk Middleware (middleware.ts)
  │  authenticates / redirects
  ▼
Next.js App Router
  ├──────────────────────────┐
  │                          │
  ▼                          ▼
Server Components        Route Handlers
+ Server Actions         (AI endpoints)
  │                          │
  ▼                          ▼
Drizzle ORM              Vercel AI SDK
(postgres.js)            + AI Gateway
  │                          │
  ▼                          ▼
Supabase Postgres        OpenAI (GPT-4o)
```

1. Every request passes through Clerk middleware, which attaches identity or redirects unauthenticated users.
2. For page loads and mutations, server components and server actions query or write to Postgres via Drizzle, always scoped to the authenticated user.
3. For AI features, route handlers forward the request to the AI Gateway, stream the response back, and the client persists the final result through a server action.

## Key Invariants

- **Tenant isolation is application-enforced.** Every query must filter by Clerk `userId`. There is no database-level fallback (no RLS).
- **AI secrets stay server-side.** The AI Gateway key is only available in server actions and route handlers.
- **Schema consistency between AI and app.** Zod schemas are the single source of truth for both AI structured output and client-side form validation.
- **Supabase is data-only.** No Supabase Auth, no Supabase Realtime, no Edge Functions. Supabase provides Postgres and nothing else.
- **Streaming is the AI response mode.** All AI endpoints stream; there are no blocking request-response AI calls.

## Deployment Topology

The application is designed for Vercel deployment. Next.js handles SSR, server actions, and route handlers on Vercel's edge/serverless infrastructure. Supabase Cloud Postgres is an external managed service. Clerk and the AI Gateway are external SaaS dependencies accessed over HTTPS.
