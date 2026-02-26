# Agentura — Documentation.md
# LIVING DOCUMENT. Agent appends a session entry after every working session.
# Answers: "What happened? What's done? What's next?"
# Never modify Prompt.md or AGENTS.md here — record decisions and status only.

---

## Current Status

**Active milestone:** 1 — Monorepo Scaffold
**Progress:** 0 / 17 milestones complete
**Last updated:** Project initialized — no sessions run yet
**Next action:** Run `npx create-turbo@latest agentura --package-manager pnpm`, create directory structure per Plan.md Milestone 1

---

## How to Run (fills in after Milestone 1)

```bash
# Install all dependencies
pnpm install

# Start web app + worker in dev mode
pnpm run dev

# Web app: http://localhost:3000
# Worker: watches for BullMQ jobs

# Type check all packages
pnpm run type-check

# Build all packages
pnpm run build

# Run CLI locally (without global install)
cd packages/cli && npx tsx src/index.ts run
```

**Required environment setup:**
1. Copy `.env.example` to `apps/web/.env.local`
2. Copy `.env.example` to `apps/worker/.env`
3. Fill in values from: Supabase dashboard, GitHub App settings, Anthropic console, OpenAI dashboard, Upstash console, Resend dashboard

---

## Milestone Status

| # | Milestone | Status | Notes |
|---|---|---|---|
| 1 | Monorepo scaffold | ⬜ Not started | First session |
| 2 | Database schema | ⬜ Not started | — |
| 3 | Shared types + eval-runner | ⬜ Not started | — |
| 4 | Next.js base + tRPC + GitHub OAuth | ⬜ Not started | — |
| 5 | GitHub App: install + webhook | ⬜ Not started | Requires human to register GitHub App in settings |
| 6 | Eval worker: golden dataset | ⬜ Not started | — |
| 7 | Eval worker: LLM judge | ⬜ Not started | — |
| 8 | Eval worker: performance + embeddings | ⬜ Not started | — |
| 9 | PR comment + Check Run | ⬜ Not started | — |
| 10 | Baseline comparison + regression | ⬜ Not started | — |
| 11 | CLI: init + run | ⬜ Not started | — |
| 12 | CLI: login + sync | ⬜ Not started | — |
| 13 | Dashboard: project list + run history | ⬜ Not started | — |
| 14 | Dashboard: trend chart + run detail | ⬜ Not started | — |
| 15 | Email notifications | ⬜ Not started | — |
| 16 | SDK package | ⬜ Not started | — |
| 17 | Production deployment | ⬜ Not started | Requires human to set up Vercel + Railway projects |

---

## Human Actions Required

Some milestones require human actions outside the codebase. Track them here:

| Milestone | Action | Status |
|---|---|---|
| 5 | Register GitHub App at github.com/settings/apps/new. Required permissions documented in Plan.md M5. Set Webhook URL to ngrok/smee URL in dev, Vercel URL in prod. | ⬜ Pending |
| 5 | Set `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_WEBHOOK_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` in `.env` | ⬜ Pending |
| 5 | Set up smee.io or ngrok for local webhook forwarding | ⬜ Pending |
| 17 | Create Vercel project, connect GitHub repo, set all env vars | ⬜ Pending |
| 17 | Create Railway project for worker, set all env vars | ⬜ Pending |
| 17 | Update GitHub App webhook URL to production Vercel domain | ⬜ Pending |
| 17 | Verify Resend sending domain | ⬜ Pending |

---

## Quick Smoke Tests

*(Agent fills in as features are built)*

```bash
# After Milestone 1
pnpm install && pnpm run type-check && pnpm run build

# After Milestone 4
curl http://localhost:3000/api/v1/health

# After Milestone 6
# Manually enqueue test eval-run job and verify DB rows created

# After Milestone 9
# Open a test PR and verify comment + Check Run appear

# After Milestone 11
npx agentura init
npx agentura run
echo "Exit code: $?"

# After Milestone 17 (production)
curl https://app.agentura.dev/api/v1/health
```

---

## Known Issues / Technical Debt

*(Agent appends issues here as discovered — never deletes, only resolves)*

*None yet — project not started.*

---

## Key Decisions (Quick Reference)

*(Mirror of Plan.md Decision Log — for fast scanning)*

| Decision | Rationale |
|---|---|
| Anthropic haiku for LLM judge | Best cost/quality for rubric evaluation |
| OpenAI embeddings + cache | Best embedding quality, cache eliminates repeat costs |
| REST for CLI + webhook, tRPC for dashboard | External callers = REST; internal = tRPC |
| BullMQ on Railway, not serverless | Evals take minutes; serverless times out |
| Scores as Float 0–1 | Avoids rounding errors in comparison logic |

---

## Session Log

*(Agent appends here after every session. Most recent session at bottom.)*

### [No sessions yet — project not started]

---

### Session Template

```markdown
## Session — [YYYY-MM-DD HH:MM UTC]

**Milestone:** [N] — [Name]
**Status:** IN PROGRESS | COMPLETE

**Files created:**
- [path] — [description]

**Files modified:**
- [path] — [what changed]

**Decisions made:**
- [decision and rationale], or "None"

**Validation results:**
- `pnpm run type-check`: PASS | FAIL
- `pnpm run build`: PASS | FAIL
- [other]: PASS | FAIL

**Issues found:**
- [issue], or "None"

**Next session:**
Milestone [N] — [specific starting task]
```
