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
(Updated by validators during execution)
