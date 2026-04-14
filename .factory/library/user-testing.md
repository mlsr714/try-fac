# User Testing

Testing surface, required tools, resource cost classification, and runtime findings.

---

## Validation Surface

### Primary: Web Browser (agent-browser)
- **URL:** http://localhost:3100
- **Auth:** Clerk-managed (sign-in via /sign-in page)
- **Pages to test:** /, /sign-in, /sign-up, /dashboard, /generate, /convert, /recipes, /recipes/[id], /pantry
- **Tool:** agent-browser skill

### Secondary: HTTP API (curl)
- **Base URL:** http://localhost:3100
- **Auth:** Cookie-based (Clerk session)
- **Endpoints:** /api/generate, /api/convert (streaming AI endpoints)
- **Tool:** curl

## Validation Concurrency

### agent-browser
- **Machine:** 2 CPU cores, 3.7 GB RAM, no swap
- **Baseline usage:** ~1.3 GB
- **Next.js dev server:** ~400 MB
- **Per agent-browser instance:** ~300-400 MB (headless Chrome + automation)
- **Available headroom after dev server:** ~2.0 GB * 0.7 = 1.4 GB usable
- **Max concurrent validators: 2** (safe — ~800 MB for 2 instances, 600 MB headroom)
- Running 3 would risk OOM with no swap available

## Runtime Findings

- User approved skipping Clerk-authenticated browser E2E validation; authenticated flows are assumed to work for final mission gate in this environment.
(Updated by validators during execution)
- 2026-04-13 foundation validation run: observed ~810 MB free RAM with no swap and multiple active droid processes; reduced effective concurrent agent-browser validators from 2 to 1 for stability.
- 2026-04-13 foundation validation run: Clerk sign-up in headless automation repeatedly stalled in loading state while console reported Private Access Token / Cloudflare challenge requests returning 401. Assertions requiring authenticated sessions were blocked by this external auth challenge.
- 2026-04-14 conversion validation run: the same Clerk/PAT challenge behavior persisted across conversion, recipes, pantry, and cross-flow groups, blocking all assertions that require an authenticated session in headless browser automation.

## Flow Validator Guidance: agent-browser

- Use dedicated browser sessions per validator and never reuse authenticated state across assertion groups.
- Stay within the assigned local surface only: `http://localhost:3100`.
- Keep account data isolated by using unique test emails per validator run.
- Do not alter application business logic or environment variables during validation.
- Evidence must be written only to the assigned mission evidence directory for the group.

### Isolation boundaries
- Session boundary: each validator owns its own browser context/cookies.
- Data boundary: each validator uses separate Clerk test identities unless explicitly testing multi-account behavior in one assigned group.
- Resource boundary: when machine memory is constrained, run agent-browser validators serially to avoid OOM.
