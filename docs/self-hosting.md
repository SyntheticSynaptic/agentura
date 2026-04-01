# Self-Hosting Agentura

Agentura is self-hostable via Docker. A [Dockerfile](../Dockerfile) is available at the repo root.

Full self-hosting documentation coming soon.

No `docker-compose.yml` exists yet.

## Local inference with Ollama

Install Ollama:

```bash
brew install ollama
```

Agentura auto-detects installed Ollama models. To use semantic similarity without an API key, install any embedding model:

```bash
ollama pull mxbai-embed-large    # recommended
ollama pull nomic-embed-text     # alternative
ollama pull qwen3-embedding      # high quality, larger
```

To use a specific model, set the env var:

```bash
OLLAMA_EMBED_MODEL=your-model-name
OLLAMA_MODEL=your-judge-model
```

## Data and privacy

Agentura writes all eval evidence to `.agentura/` in your project directory. Nothing is sent to external servers when running with `--local`.

What stays on disk:
- `.agentura/eval-runs/` — per-run eval records
- `.agentura/traces/` — consensus and trace outputs
- `.agentura/baseline.json` — regression baseline
- `.agentura/manifest.json` — audit manifest

What you may want to commit:
- `.agentura/reference/` — frozen reference snapshots, so drift detection works consistently in CI

The default .gitignore added by `agentura init` excludes runtime artifacts and keeps reference snapshots. You control your data lifecycle — nothing is retained externally.
