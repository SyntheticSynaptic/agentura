# Demo Agent Example

[Back to Agentura](../../README.md)

This mock setup powers the terminal recording in [`docs/demo.tape`](../../docs/demo.tape).

It intentionally spreads five golden cases across five one-case suites so the local results table shows three green passes and two red fails. The `accuracy` suite uses `semantic_similarity` to demonstrate the scorer, and it still passes offline because Agentura falls back to local token overlap when no embedding provider key is available.

Run it with:

```bash
npx agentura@latest run --local
```
