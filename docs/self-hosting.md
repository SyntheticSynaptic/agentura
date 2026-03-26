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
