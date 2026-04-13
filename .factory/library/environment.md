# Environment

Environment variables, external dependencies, and setup notes.

**What belongs here:** Required env vars, external API keys/services, dependency quirks, platform-specific notes.
**What does NOT belong here:** Service ports/commands (use `.factory/services.yaml`).

---

## Required Environment Variables (.env.local)

| Variable | Purpose | Server/Client |
|----------|---------|---------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk auth (client-side) | Client |
| `CLERK_SECRET_KEY` | Clerk auth (server-side) | Server |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign-in route (`/sign-in`) | Client |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign-up route (`/sign-up`) | Client |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Post-login redirect (`/dashboard`) | Client |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Post-signup redirect (`/dashboard`) | Client |
| `DATABASE_URL` | Supabase Postgres connection pooler URL (port 6543) | Server |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key (`vck_...`) | Server |

## External Dependencies

- **Clerk Cloud** — Authentication provider. No local setup needed.
- **Supabase Cloud** — Postgres database. Connection via pooler URL (port 6543, Transaction mode).
- **Vercel AI Gateway** — Routes to OpenAI GPT-4o. Single key replaces provider-specific keys.

## Key Gotchas

- Supabase pooler uses Transaction mode: MUST use `{ prepare: false }` in postgres.js client
- `cookies()` is async in modern Next.js (15+) — always `await` it
- `auth()` from Clerk is async in modern Next.js (15+) — always `await` it
- AI Gateway uses `gateway('openai/gpt-4o')` import from `ai` package — NOT `@ai-sdk/openai`
- `convertToModelMessages()` is async in AI SDK v6
- Messages use `parts[]` array, not `content` string in AI SDK v6
- `@clerk/nextjs` v7: prefer `<Show whenSignedIn>` / `<Show whenSignedOut>` patterns; `SignedIn`/`SignedOut` imports may be unavailable
- This repo's shadcn/base-ui composition pattern often uses `render` props for trigger/content composition (not Radix-style `asChild`)
