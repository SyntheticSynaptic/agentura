# Agentura

[![npm version](https://img.shields.io/npm/v/agentura.svg)](https://www.npmjs.com/package/agentura)
[![CI](https://github.com/SyntheticSynaptic/agentura/actions/workflows/ci.yml/badge.svg)](https://github.com/SyntheticSynaptic/agentura/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

CI/CD eval platform for AI agents. Catch regressions before 
they reach production.

## Try it in 60 seconds (no signup required)

```bash
npx agentura@latest init
npx agentura@latest run --local
```

`--local` mode runs your eval suites entirely on your machine —
no login, no GitHub App, no cloud calls required.

## What it does

- Runs golden dataset, LLM judge, and performance eval suites
  against your agent
- Catches regressions on every PR via GitHub Check and PR comment
- Works with any agent: OpenAI, Anthropic, LangChain, or any
  HTTP endpoint
- Self-hostable and open source (MIT)

## Quick Start (with GitHub integration)

1. Install the GitHub App →
   https://github.com/apps/agenturaci/installations/new
2. Add `agentura.yaml` to your repo root
3. Add your eval dataset
4. Open a PR — results appear as a PR comment and Check Run

Full guide: [docs/quickstart.md](docs/quickstart.md)

## Works with any agent

| Framework | Example |
|---|---|
| OpenAI Agents SDK | [examples/openai-agent](examples/openai-agent) |
| LangChain | [examples/langchain-agent](examples/langchain-agent) |
| Any HTTP endpoint | [examples/http-agent](examples/http-agent) |
No SDK Required! 

## GitHub Actions

Add eval to any repo in one step:

```yaml
- uses: SyntheticSynaptic/agentura@main
  with:
    config: agentura.yaml
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

Full docs: [docs/github-action.md](docs/github-action.md)

## Configuration

```yaml
version: 1
agent:
  type: http
  endpoint: https://your-agent.example.com/api/agent
  timeout_ms: 10000
evals:
  - name: accuracy
    type: golden_dataset
    dataset: ./evals/accuracy.jsonl
    scorer: exact_match
    threshold: 0.8
  - name: quality
    type: llm_judge
    dataset: ./evals/quality.jsonl
    rubric: ./evals/rubric.md
  - name: performance
    type: performance
    max_p95_ms: 3000
    max_cost_per_call_usd: 0.01
ci:
  block_on_regression: false
  compare_to: main
  post_comment: true
```

## Eval Strategies

| Strategy | Use case | Requires |
|---|---|---|
| `golden_dataset` | Exact/fuzzy match accuracy | Nothing |
| `llm_judge` | Tone, helpfulness, quality | Any LLM API key |
| `performance` | Latency and cost guardrails | Nothing |

LLM judge auto-detects your provider: set `ANTHROPIC_API_KEY`,
`OPENAI_API_KEY`, `GEMINI_API_KEY`, or `GROQ_API_KEY`.

## Comparison

| Feature | Agentura | Braintrust | LangSmith | DeepEval |
|---|---|---|---|---|
| Open source | ✅ MIT | ❌ | ❌ | ✅ |
| CI/CD native | ✅ | Partial | ❌ | Partial |
| Framework agnostic | ✅ | ✅ | LangChain-first | ✅ |
| Self-hostable | ✅ | ❌ | ❌ | ✅ |
| GitHub PR comments | ✅ Built-in | Via API | ❌ | ❌ |
| Local mode (no signup) | ✅ | ❌ | ❌ | Partial |

## Self-hosting

Agentura is fully open source. See
[docs/self-hosting.md](docs/self-hosting.md) to run your own 
instance.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
