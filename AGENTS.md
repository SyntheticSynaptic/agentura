# Agentura — AGENTS.md
# Automatically read by Codex at the start of every session.
# Source of truth for stack, standards, and operating rules.
# Do NOT modify during implementation. Update Documentation.md instead.

---

## What We're Building

**Agentura** is an AI agent evaluation CI/CD platform — "Codecov, but for agent reliability."

When a developer changes their AI agent's code, prompt, model version, or configuration, Agentura automatically runs evaluation suites against the agent and posts results as a PR comment. If quality drops below defined thresholds, the PR check fails and deployment is blocked. Every eval run contributes to a growing benchmark dataset that becomes the world's most comprehensive picture of AI agent performance by task type.

This is completely distinct from GitHub Agentic Workflows (which uses AI agents to do repo tasks). Agentura measures whether your AI agents are performing correctly — a quality assurance layer for the agent economy.

**The product has three entry points:**
1. `npx agentura` — CLI for running evals locally and in CI
2. GitHub App — installs on a repo, automatically runs evals on every PR that touches agent code
3. Web Dashboard — `app.agentura.dev` — shows eval history, score trends, regression alerts, and benchmark comparisons

**The long-term moat:** Every eval run generates proprietary benchmark data. After 10M eval runs across thousands of agent deployments, Agentura has the world's largest verified performance dataset for AI agents by task type. That dataset becomes the foundation for an agent reputation and identity layer — the trust infrastructure for the agent economy.

Full spec: `docs/Prompt.md`
Milestone plan: `docs/Plan.md`
Execution runbook: `docs/Implement.md`
Live status: `docs/Documentation.md`

**Read all four docs files before writing any code. Every session without exception.**

---

## Stack (Frozen — Do Not Change Without Human Approval)

| Layer | Choice | Reason |
|---|---|---|
| CLI | TypeScript + Commander.js, published as `agentura` on npm | Developer-native entry point |
| Web app framework | Next.js 14 App Router + TypeScript | Server components, API routes, Vercel deployment |
| API style | tRPC (web app) + REST (CLI-facing endpoints, GitHub webhook) | tRPC for dashboard; REST for CLI + GitHub App (simpler for external callers) |
| Database | Supabase (PostgreSQL) + Prisma ORM | RLS on all tables, Realtime for dashboard |
| Auth | Supabase Auth — GitHub OAuth primary, email fallback | Developers live on GitHub |
| GitHub App | `@octokit/app` + `@octokit/webhooks` | Handles installation, webhooks, PR comments, check runs |
| Eval runner | Node.js worker service (BullMQ on Upstash Redis) | Persistent process, handles long-running eval jobs |
| LLM-as-judge | Anthropic SDK (claude-3-5-haiku for cost, claude-sonnet for complex rubrics) | Best eval quality per cost |
| Realtime dashboard | Supabase Realtime | Live eval progress streaming |
| Email | Resend | Eval failure alerts, weekly digest |
| Monorepo | Turborepo + pnpm | |
| UI | shadcn/ui + Tailwind CSS | |
| Deployment | Vercel (web app) + Railway (eval worker) | Worker needs persistent process |
| Error tracking | Sentry | Both web and worker |

---

## Monorepo Structure

```
agentura/
  AGENTS.md           ← THIS FILE LIVES AT THE REPO ROOT (Codex auto-reads it from here)
  apps/
    web/              → Next.js 14 dashboard + tRPC API + REST endpoints + GitHub App webhooks
    worker/           → BullMQ eval runner (Railway, persistent)
  packages/
    cli/              → `agentura` npm package (npx agentura)
    sdk/              → @agentura/sdk — programmatic eval runner for Node.js
    db/               → Prisma schema + client (shared)
    types/            → Shared TypeScript interfaces
    ui/               → shadcn/ui component library
    eval-runner/      → Core eval execution logic (shared between CLI and worker)
  docs/
    Prompt.md         ← frozen product spec
    Plan.md           ← milestone plan (agent updates this)
    Implement.md      ← execution runbook
    Documentation.md  ← living audit log (agent updates this every session)
```

---

## Key Domain Concepts (Read This — It Affects All Code)

**Eval Suite**: A named collection of eval cases defined in `agentura.yaml`. Example: "accuracy", "quality", "latency".

**Eval Case**: A single test. Has an `input` and optionally an `expected_output`. May use different eval strategies.

**Eval Strategy**: How a case is scored. Three strategies supported at MVP — do not add others:
- `golden_dataset`: Compare agent output to expected output using exact match or semantic similarity (cosine similarity via embeddings)
- `llm_judge`: Pass input + agent output to a judge LLM with a rubric. Returns score 0–1.
- `performance`: Measure latency (p50, p95, p99) and cost (token count × model pricing)

Note: `trajectory` evaluation (tool call sequence checking) is explicitly out of scope for MVP. Do not implement it.

**Eval Run**: One execution of an eval suite against a specific agent version. Has a score, pass/fail status, and comparison to a baseline.

**Baseline**: The eval run result from the target branch (usually `main`). Regressions are detected by comparing current run to baseline.

**Check Run**: The GitHub PR check created by the GitHub App. Green if all suites pass thresholds. Red if any regression.

**Agent Endpoint**: How Agentura calls the agent being evaluated. Supported types:
- `http`: POST to a URL with `{ input }`, receive `{ output }`
- `cli`: Run a shell command with input on stdin, capture stdout
- `sdk`: Import a Node.js function directly (same-process evaluation)

---

## `agentura.yaml` Config File Format

This is the central config file developers put in their repo. Every code decision must be consistent with this schema.

```yaml
version: 1

agent:
  type: http              # http | cli | sdk
  endpoint: http://localhost:3000/api/agent   # for type: http
  command: node agent.js  # for type: cli
  module: ./agent.ts      # for type: sdk
  timeout_ms: 30000       # max time to wait for agent response

evals:
  - name: accuracy
    type: golden_dataset
    dataset: ./evals/accuracy.jsonl   # JSONL: {"input": "...", "expected": "..."}
    scorer: semantic_similarity        # exact_match | semantic_similarity | contains
    threshold: 0.85                    # fail run if score < this

  - name: quality
    type: llm_judge
    dataset: ./evals/quality.jsonl    # JSONL: {"input": "..."}  (no expected)
    rubric: ./evals/quality_rubric.md  # markdown rubric for judge
    judge_model: claude-3-5-haiku-20251001
    threshold: 0.80

  - name: latency
    type: performance
    dataset: ./evals/latency.jsonl
    max_p95_ms: 5000
    max_cost_per_call_usd: 0.05

ci:
  block_on_regression: true      # fail PR check if score drops
  regression_threshold: 0.05     # allow up to 5% drop before failing
  compare_to: main               # branch to compare against
  post_comment: true             # post eval results as PR comment
  fail_on_new_suite: false       # don't fail if new eval suite has no baseline yet
```

---

## Coding Standards

- TypeScript strict mode everywhere. No `any` without a comment.
- All monetary values (token costs) in microdollars (integer). Never floats for money.
- Eval scores always in range [0, 1]. Never percentages in database — only in display layer.
- All LLM judge calls include `temperature: 0` for determinism.
- Every eval run is immutable once completed. Never update completed run rows.
- GitHub App webhook handler must verify `x-hub-signature-256` before processing.
- Rate limit: CLI may not make more than 10 concurrent eval requests without user opt-in.
- All Anthropic API calls use exponential backoff (3 retries, 1s/2s/4s delays).
- Eval dataset files (.jsonl) have max 1000 cases per file. Warn if exceeded.
- Cache embeddings for semantic similarity: same text = same embedding, stored in DB.

---

## Dependency Rule

Do not install new npm packages without human approval. If needed, output:

```
PACKAGE REQUEST
Package: [name@version]
Used for: [specific purpose]
Alternative considered: [what you tried first]
Awaiting approval.
```

---

## Error Protocol

After 2 failed attempts on any error, stop and output:

```
BLOCKED
Milestone: [N] — [Name]
Implementing: [specific thing]
Attempt 1: [what you tried] → [exact error]
Attempt 2: [what you tried] → [exact error]
Hypothesis: [suspected root cause]
Question: [one specific question for the human]
```

Do not change the stack. Do not add libraries. Wait for human input.

---

## Scope Rule

Build minimum code to pass current milestone acceptance criteria. Do not refactor working code, add unrequested features, or optimize until all milestones are complete.

Before coding, state:
```
Working on: Milestone [N] — [Name]
Files I will create/modify: [list]
```

---

## Session Handoff

End every session by updating `docs/Documentation.md` with session summary. See Implement.md for exact format.
