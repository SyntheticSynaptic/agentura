# Contributing to Agentura

## Prerequisites

- Node.js 20+
- pnpm 9+

## Setup

```bash
git clone https://github.com/SyntheticSynaptic/agentura
cd agentura
pnpm install
pnpm build
```

## Development

```bash
pnpm dev        # runs all packages in watch mode via turbo
pnpm type-check # typecheck all packages
```

## Running tests

```bash
pnpm test                              # all tests
cd packages/eval-runner && pnpm test  # eval runner only
cd packages/cli && pnpm test          # CLI only
```

## Project structure

- `apps/web`: Next.js dashboard
- `apps/worker`: BullMQ eval runner
- `packages/cli`: The agentura CLI (published to npm)
- `packages/eval-runner`: Core eval execution logic
- `packages/sdk`: SDK for agent instrumentation
- `packages/types`: Shared TypeScript types
- `packages/db`: Prisma ORM layer

## Adding a new eval strategy

Add new strategies under `packages/eval-runner/src/strategies/`.

## PR conventions

- Branch naming: `feat/`, `fix/`, `docs/`, `chore/`
- Commit messages: conventional commits format
- PRs should include tests for new functionality
- Run `pnpm type-check` before opening a PR

## Questions

Open a GitHub Discussion rather than an issue for questions.

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org). Please help keep the community respectful, constructive, and welcoming.
