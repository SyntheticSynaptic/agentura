# Self-Hosting Agentura

Agentura is self-hostable via Docker. A [Dockerfile](../Dockerfile) is available at the repo root.

Full self-hosting documentation coming soon.

No `docker-compose.yml` exists yet.

## Local inference with Ollama

Install Ollama:

```bash
brew install ollama
```

Pull the default judge and embedding models:

```bash
ollama pull llama3.2 && ollama pull nomic-embed-text
```

Agentura auto-detects Ollama when it is running.
