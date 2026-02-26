# Agentura — Implement.md
# EXECUTION RUNBOOK. Read before writing any code, every session without exception.
# HOW to operate. WHAT to build is in Prompt.md. SEQUENCE is in Plan.md. STATUS is in Documentation.md.

---

## Before You Write Code — Every Session

Read in this order, no exceptions:

1. `docs/AGENTS.md` — stack, standards, error protocol, scope rules
2. `docs/Prompt.md` — product definition, hard constraints, demo flow
3. `docs/Plan.md` — current milestone, acceptance criteria, decision log
4. `docs/Documentation.md` — what was built last session, what's next

Priority order when files conflict: **AGENTS.md > Prompt.md > Plan.md > Documentation.md**

---

## The Operating Loop

For every milestone:

```
1. READ     → Re-read current milestone in Plan.md completely
2. SCOPE    → State files you will create/modify (nothing else)
3. BUILD    → Minimum code to satisfy acceptance criteria
4. VALIDATE → Run all validation commands from Plan.md
5. FIX      → If validation fails, fix before moving on. No exceptions.
6. RECORD   → Update Documentation.md with session summary
7. DECLARE  → Output "MILESTONE [N] COMPLETE ✅" with evidence
8. NEXT     → Only then proceed
```

Never skip step 4. Never skip step 6. "It should work" is not validation.

---

## Scope Declaration (Required Before Any Code)

Before writing the first line of code each session:

```
SCOPE DECLARATION
Working on: Milestone [N] — [Name]
Files I will CREATE:
  - [path]
Files I will MODIFY:
  - [path]
Files I will NOT touch: everything else
```

If you discover mid-implementation that a file outside your declared scope needs changing, stop. Update your scope declaration. Then continue.

---

## Dependency Rule

No new npm packages without human approval. Output this format and stop:

```
PACKAGE REQUEST
Package: [name@version]
Used for: [specific purpose — one sentence]
Already in package.json? [yes/no]
Alternative tried: [what you tried without it]
Awaiting approval.
```

---

## Error Protocol

Two attempts maximum. After that, stop and output:

```
BLOCKED
Milestone: [N] — [Name]
Implementing: [specific function/file/feature]
Attempt 1: [what you did] → [exact error message or stack trace, verbatim]
Attempt 2: [what you did] → [exact error message or stack trace, verbatim]
Hypothesis: [most likely root cause in one sentence]
Unblock question: [one specific, answerable question for the human]
```

Do not change stack. Do not add libraries. Do not refactor other code while stuck. Wait.

---

## Critical Rules for This Codebase

### Eval Score Handling
- Scores are always `Float` in range [0.0, 1.0] in database and TypeScript types
- Display as percentage only in UI layer: `(score * 100).toFixed(1) + '%'`
- Never store or compare percentages — always the raw 0–1 float
- Regression check: `delta = currentScore - baselineScore; isRegressed = delta < -regressionThreshold`

### GitHub App Authentication
- Every call to GitHub API on behalf of an installation uses an installation access token
- Installation access tokens expire after 1 hour — always fetch fresh via `app.getInstallationOctokit(installationId)`
- Never cache or store installation access tokens — fetch fresh every time
- The App's own JWT (for listing installations) is separate from installation tokens

### LLM Judge Determinism
- Every Anthropic API call for judging MUST use `temperature: 0`
- Log a warning and throw an error if temperature is anything other than 0 in judge calls
- Judge prompt must request JSON response with exactly these fields: `{ "score": number, "reason": string }`
- Parse with try/catch — on failure set `score = 0` and `reason = "Judge response parsing failed: [raw response]"`

### Webhook Security
- GitHub webhook handler must be the FIRST thing that runs: verify signature, return 400 if invalid
- Use `@octokit/webhooks` `verify()` function — do not implement HMAC manually
- Never process a webhook event that fails signature verification, even in development
- Use `GITHUB_APP_WEBHOOK_SECRET` env var — never hardcode

### File Fetching from GitHub
- Use `octokit.repos.getContent()` to fetch `agentura.yaml` and dataset files
- The content is base64-encoded — always decode: `Buffer.from(data.content, 'base64').toString('utf-8')`
- Handle 404 gracefully: if `agentura.yaml` not found, skip the run (log: "No agentura.yaml found in repo, skipping eval run")
- JSONL files: parse line by line, skip blank lines, catch JSON.parse errors per line

### Dataset File Limits
- Maximum 1000 cases per JSONL dataset file
- If a file exceeds 1000 lines, log a warning, process only the first 1000 cases
- Warn in CLI output: "Dataset accuracy.jsonl has 1200 cases, processing first 1000 (limit)"

### Parallelism
- Default: 10 concurrent agent calls per eval run
- Use `p-limit` for concurrency control — request human approval before installing
- Never run all cases simultaneously regardless of dataset size
- Honor `agent.timeout_ms` per case using `AbortController` + `Promise.race`

---

## CLI-Specific Rules

### Terminal Output Format
The CLI must show case-by-case progress as cases complete (streaming, not buffered):
```
Running [suiteName] ([strategy])...
  Case 1/N [✅|❌] [[score]]
  Case 2/N [✅|❌] [[score]]
```
Use `process.stdout.write` with `\r` or proper line management — do not use `console.log` for progress (it buffers).

### Config File Parsing
- Validate `agentura.yaml` against schema on load — produce specific error messages for each invalid field
- Good error: "agentura.yaml: evals[0].threshold must be a number between 0 and 1, got: 'high'"
- Bad error: "Invalid config"
- Use `zod` to define the config schema and parse with `.safeParse()` — request human approval if not installed

### Exit Codes
- `agentura run`: exit 0 if all suites pass, exit 1 if any suite fails, exit 2 if config error, exit 3 if agent unreachable
- `agentura init`: exit 0 on success, exit 1 on error
- `agentura login`: exit 0 on success, exit 1 on error
- `agentura sync`: exit 0 on success, exit 1 on network error

---

## PR Comment Rules

- Search for existing Agentura PR comment before posting (look for comment body containing "## Agentura Eval Results")
- If found: update the existing comment using `octokit.issues.updateComment()`
- If not found: create new comment using `octokit.issues.createComment()`
- Never post duplicate comments — one Agentura comment per PR, always
- If comment update fails (e.g., comment deleted): create a new one, do not throw

---

## Updating Documentation.md (Required Every Session)

Append this block at the end of the Session Log section in `docs/Documentation.md`:

```markdown
## Session — [YYYY-MM-DD HH:MM UTC]

**Milestone:** [N] — [Name]
**Status:** IN PROGRESS | COMPLETE

**Files created:**
- [path] — [one-line description]

**Files modified:**
- [path] — [what changed]

**Decisions made:**
- [decision] — [rationale], or "None"

**Validation results:**
- `[command]`: PASS | FAIL
- `pnpm run type-check`: PASS | FAIL

**Issues found:**
- [issue description], or "None"

**Next session:**
Milestone [N] — [exact task, specific enough to start without asking]
```

---

## What "Complete" Means

A milestone is complete ONLY when all five conditions are true:
1. All acceptance criteria in Plan.md are checked off
2. All validation commands passed (exit 0 or expected response)
3. `pnpm run type-check` exits 0 across the entire monorepo
4. `Documentation.md` updated with session summary
5. You have output: `MILESTONE [N] COMPLETE ✅`

Partial completion does not count. Do not proceed to the next milestone until all five conditions are met.
