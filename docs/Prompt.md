# Agentura — Prompt.md
# FROZEN SPECIFICATION. Do not modify during implementation.
# Defines what the product is, hard constraints, deliverables, and the demo that proves it works.
# Conflicts between this file and any other: this file wins.

---

## The Product

**Agentura** is the eval CI/CD platform for AI agents. It answers the question every team deploying AI agents has but can't answer today: *"Did my changes make my agent better or worse?"*

Developers add a `agentura.yaml` config to their repo, define eval suites (test cases + scoring rubrics), and install the GitHub App. From that point forward, every PR that touches agent code automatically runs evals, posts a summary comment, and creates a GitHub Check Run that passes or fails based on quality thresholds. Regressions are caught before they reach production.

The secondary entry point is a CLI (`npx agentura run`) for running evals locally during development and in non-GitHub CI systems.

The business model: free tier (100 eval cases/month), Pro ($49/month, 10k cases), Team ($199/month, 100k cases, team dashboard), Enterprise (custom). Eval cases are the unit because they drive LLM API costs.

---

## Goals

1. Developer runs `npx agentura init` in a repo, adds eval cases, and gets a passing GitHub Check on their next PR — in under 15 minutes from zero.
2. GitHub App posts a clear PR comment showing: suite name, score, baseline comparison, pass/fail per case, estimated LLM cost.
3. Three eval strategies work end-to-end: `golden_dataset` (with both `exact_match` and `semantic_similarity` scorers), `llm_judge`, and `performance`.
4. Baseline comparison: eval run on a PR branch compares to the eval run on the target branch (main). Regression detection blocks the PR check if score drops more than the configured threshold.
5. Web dashboard at `app.agentura.dev` shows: eval run history, score trend chart per suite, individual case results (inputs, outputs, scores), and regression alerts.
6. CLI (`npx agentura`) works fully offline for local eval runs, storing results in `.agentura/` directory. When authenticated, syncs results to cloud.
7. All three agent endpoint types work: `http`, `cli`, and `sdk`.
8. LLM-as-judge uses Anthropic claude-3-5-haiku with structured output (score 0–1 + reason string) and temperature 0 for determinism.
9. Semantic similarity scoring uses text-embedding-3-small (OpenAI) with cosine similarity, with embedding cache to avoid redundant API calls.
10. GitHub App creates a Check Run (not just a PR comment) so eval results integrate with branch protection rules.

---

## Non-Goals (Do Not Build)

- Support for eval strategies beyond the three defined above (golden_dataset, llm_judge, performance) — keep it focused
- Multi-repo aggregate dashboards — single repo per project at MVP
- Slack or Teams notifications — email only at MVP
- Support for non-GitHub version control (GitLab, Bitbucket) — GitHub only at MVP
- Automatic eval case generation — users write their own cases
- Any form of agent execution environment — Agentura calls the agent's endpoint; it does not run the agent itself
- Real-time streaming of agent outputs during eval
- Visual eval case editor in the dashboard — users edit JSONL files locally
- Billing and payment processing — free tier only at MVP, billing is post-launch

---

## Hard Constraints

### Performance
- CLI `agentura run` command: first output within 2 seconds of invocation (progress shown immediately, not after eval completes)
- Eval worker processes a 100-case golden_dataset suite in under 60 seconds (parallelism: 10 concurrent agent calls)
- GitHub App webhook to first PR comment: under 90 seconds for a 50-case suite
- Dashboard eval history page load: under 1.5 seconds (server-rendered)
- Embedding cache hit: under 50ms

### Correctness
- LLM judge calls must use `temperature: 0`. Never use a non-zero temperature for scoring.
- Eval runs are immutable once status is `completed`. No updates to completed run data.
- Baseline comparison must use the most recent `completed` run on the target branch, not any failed or in-progress run.
- Semantic similarity threshold for "pass" on golden_dataset is configurable per suite, not hardcoded.
- Regression is defined as: `(current_score - baseline_score) < -regression_threshold`. If baseline doesn't exist (new suite), no regression is detected — the run can still fail on absolute threshold.

### Security
- GitHub App webhook: verify `x-hub-signature-256` header using HMAC-SHA256 before processing any event.
- API keys (CLI auth tokens) stored hashed in database. Never plaintext.
- Eval results are scoped to the project (repo installation). User A cannot read User B's eval results.
- Row-level security on all Supabase tables.
- Never log agent inputs or outputs beyond the configured retention period (default: 30 days). Truncate stored outputs at 10,000 characters.
- LLM judge rubric files are user-provided — sanitize them before including in judge prompts (strip prompt injection attempts).

### Developer Experience
- `npx agentura init` must produce a working `agentura.yaml` with inline comments explaining every field.
- CLI must show real-time progress (cases completed / total, current score) during a run — not just a spinner.
- Every error message must include: what failed, why it likely failed, and what to do next.
- PR comment must be readable on mobile — no wide tables, clear pass/fail indicators.
- GitHub Check annotation must point to the specific eval case that caused failure (file + line number in JSONL).

### Platform
- Monorepo: Turborepo + pnpm. No mixing of package managers.
- Worker must run as a persistent process (BullMQ). Not serverless — evals can take minutes.
- CLI package must work with `npx agentura` without global install.
- All environment variable names documented in `.env.example`. No hardcoded secrets anywhere.

---

## Deliverables

### CLI (`packages/cli` → published as `agentura` on npm)
- [ ] `npx agentura init` — interactive wizard, writes `agentura.yaml` + sample dataset files
- [ ] `npx agentura run` — run all eval suites locally, show live progress, print summary table
- [ ] `npx agentura run --suite accuracy` — run one suite by name
- [ ] `npx agentura compare` — compare last two local runs, show regression report
- [ ] `npx agentura login` — authenticate with GitHub OAuth, stores token in `~/.agentura/config.json`
- [ ] `npx agentura sync` — upload local run results to cloud dashboard
- [ ] `npx agentura view` — open dashboard in browser for this repo

### Web App (`apps/web`)
- [ ] `/` — landing page with clear value prop, "Install GitHub App" CTA, demo GIF
- [ ] `/login` — GitHub OAuth login
- [ ] `/dashboard` — list of user's projects (repos with app installed)
- [ ] `/projects/[owner]/[repo]` — project overview: recent eval runs, score trend chart per suite
- [ ] `/projects/[owner]/[repo]/runs/[runId]` — run detail: per-suite scores, per-case breakdown (input, output, score, pass/fail)
- [ ] `/projects/[owner]/[repo]/settings` — thresholds, notification preferences, retention settings
- [ ] `GET /api/v1/projects/:owner/:repo/runs` — REST endpoint (CLI uses this)
- [ ] `POST /api/v1/runs` — REST endpoint: CLI submits run results
- [ ] `POST /api/webhooks/github` — GitHub App webhook handler (installation, push, pull_request events)

### Worker (`apps/worker`)
- [ ] BullMQ worker processing `eval-run` queue
- [ ] Handles all three eval strategies: golden_dataset, llm_judge, performance
- [ ] Posts PR comment on completion
- [ ] Updates GitHub Check Run (pending → completed with pass/fail)
- [ ] Handles agent timeouts gracefully (mark case as failed, continue suite)
- [ ] Parallelism: 10 concurrent agent calls per eval run (configurable)

### SDK (`packages/sdk` → `@agentura/sdk`)
- [ ] `AgenturaClient` class for programmatic eval execution
- [ ] `client.runSuite(suiteConfig, agentFn)` — run an eval suite against an in-process agent function
- [ ] `client.compareToBaseline(runResult)` — compare result to cloud baseline
- [ ] TypeScript types exported for all config and result types

### Eval Runner (`packages/eval-runner`)
- [ ] `runGoldenDataset(cases, agentFn, scorer)` — executes golden dataset eval
- [ ] `runLlmJudge(cases, agentFn, rubric, judgeModel)` — executes LLM judge eval
- [ ] `runPerformance(cases, agentFn, thresholds)` — measures latency and cost
- [ ] `scoreSemanticSimilarity(a, b, embeddingCache)` — cosine similarity with cache
- [ ] `scoreExactMatch(a, b)` — exact string match (trimmed, lowercased)
- [ ] `scoreContains(output, expected)` — checks if output contains expected substring
- [ ] All functions are pure and testable with no side effects

---

## Done When — Full Demo Flow

The project is complete when this flow works end-to-end without errors:

**Act 1 — Local setup**
1. Developer clones a repo containing a simple AI agent (`POST /api/agent` → calls Claude and returns a response)
2. Runs `npx agentura init` in the repo
3. Wizard prompts for agent endpoint type (http), endpoint URL, and asks to create sample eval suites
4. Writes `agentura.yaml` and `evals/accuracy.jsonl` (5 sample golden dataset cases) and `evals/quality_rubric.md`
5. Developer runs `npx agentura run`
6. Terminal shows real-time progress: "Running accuracy (1/5)... (2/5)..." with live score
7. Final table shows: suite name, cases, score, threshold, status (PASS/FAIL)
8. Results saved to `.agentura/runs/[timestamp].json`

**Act 2 — GitHub App integration**
9. Developer visits `app.agentura.dev`, logs in with GitHub
10. Installs GitHub App on their repo
11. Dashboard shows repo with "No eval runs yet"
12. Developer opens a PR that changes the agent's system prompt
13. Within 5 seconds of PR open, GitHub Check Run appears as "Agentura Evals — pending"
14. Worker pulls `agentura.yaml` from the repo, runs eval suites against the agent endpoint
15. PR comment appears within 90 seconds showing eval results table
16. GitHub Check Run updates to green (PASS) or red (FAIL) with annotation

**Act 3 — Regression detection**
17. Developer modifies the agent to use a cheaper, lower-quality model
18. Opens a new PR
19. Eval runs, detects score dropped 12% on the `accuracy` suite (above the 5% `regression_threshold`)
20. PR Check Run fails with annotation: "accuracy suite regressed: 0.71 → 0.63 (-0.08, threshold: -0.05)"
21. PR comment shows baseline comparison with red indicator on accuracy suite
22. Developer fixes the regression, pushes new commit, eval re-runs automatically

**Act 4 — Dashboard**
23. Developer visits `/projects/[owner]/[repo]`
24. Score trend chart shows last 10 runs, including the regression dip and recovery
25. Click on a specific run → see per-case breakdown with inputs, outputs, judge reasoning, scores
26. Settings page shows current thresholds, option to update them

---

## Kickoff Prompt for Codex

```
Read docs/Prompt.md, docs/Plan.md, docs/Implement.md, and docs/Documentation.md in full.
Prompt.md is the frozen product specification. Plan.md defines the milestone sequence.
Implement.md is your operating runbook. Documentation.md shows current status.

Begin work on the current milestone shown in Documentation.md.
Follow Implement.md exactly. Stack is defined in AGENTS.md — do not deviate.
```
