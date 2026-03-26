# GitHub Action

Add this workflow to `.github/workflows/eval.yml`:

```yaml
name: Agent Eval
on: [pull_request]
jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: SyntheticSynaptic/agentura@main
        with:
          config: agentura.yaml
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

Any one of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `GROQ_API_KEY` can be used for `llm_judge` suites.

Composite actions inherit environment variables from the caller, so pass the API key in the workflow that uses the action.
