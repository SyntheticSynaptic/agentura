const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
const OLLAMA_REACHABILITY_TIMEOUT_MS = 1_000;
const OLLAMA_EMBED_MODEL_KEYWORDS = [
  "embed",
  "mxbai",
  "nomic",
  "all-minilm",
  "qwen3-embedding",
] as const;

export const OLLAMA_EMBEDDING_MODEL_WARNING =
  "Ollama is running but no embedding model was found.\nInstall one with: ollama pull mxbai-embed-large\nOr set the model explicitly: OLLAMA_EMBED_MODEL=your-model";

export type OllamaFetchLike = typeof fetch;

const reachabilityCache = new Map<string, Promise<boolean>>();
const tagsCache = new Map<string, Promise<string[] | null>>();

interface OllamaTagsResponse {
  models?: Array<{
    name?: string;
    model?: string;
  }>;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getOllamaBaseUrl(
  env: Record<string, string | undefined> = process.env
): string {
  const configured = env.OLLAMA_BASE_URL?.trim();
  if (!configured) {
    return DEFAULT_OLLAMA_BASE_URL;
  }

  return normalizeBaseUrl(configured);
}

function getOllamaJudgeModelOverride(
  env: Record<string, string | undefined> = process.env
): string | null {
  return env.OLLAMA_MODEL?.trim() || null;
}

function getOllamaEmbeddingModelOverride(
  env: Record<string, string | undefined> = process.env
): string | null {
  return env.OLLAMA_EMBED_MODEL?.trim() || null;
}

async function fetchOllamaModelNames(
  baseUrl: string,
  fetchImpl: OllamaFetchLike
): Promise<string[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_REACHABILITY_TIMEOUT_MS);

  try {
    const response = await fetchImpl(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });

    if (response.status !== 200) {
      return null;
    }

    const payload = (await response.json()) as OllamaTagsResponse;
    const names = payload.models
      ?.map((model) => model.name?.trim() || model.model?.trim() || "")
      .filter((name) => name.length > 0);

    return names ?? [];
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function isOllamaReachable(
  env: Record<string, string | undefined> = process.env,
  fetchImpl: OllamaFetchLike = fetch
): Promise<boolean> {
  const baseUrl = getOllamaBaseUrl(env);
  const cached = reachabilityCache.get(baseUrl);

  if (cached) {
    return cached;
  }

  const availabilityPromise = (async () => {
    const names = await getOllamaModelNames(env, fetchImpl);
    return names !== null;
  })().catch(() => false);
  reachabilityCache.set(baseUrl, availabilityPromise);
  return availabilityPromise;
}

export async function getOllamaModelNames(
  env: Record<string, string | undefined> = process.env,
  fetchImpl: OllamaFetchLike = fetch
): Promise<string[] | null> {
  const baseUrl = getOllamaBaseUrl(env);
  const cached = tagsCache.get(baseUrl);

  if (cached) {
    return cached;
  }

  const namesPromise = fetchOllamaModelNames(baseUrl, fetchImpl).catch(() => null);
  tagsCache.set(baseUrl, namesPromise);
  return namesPromise;
}

export async function detectOllamaJudgeModel(
  env: Record<string, string | undefined> = process.env,
  fetchImpl: OllamaFetchLike = fetch
): Promise<string | null | undefined> {
  const override = getOllamaJudgeModelOverride(env);
  if (override) {
    return override;
  }

  const modelNames = await getOllamaModelNames(env, fetchImpl);
  if (modelNames === null) {
    return undefined;
  }

  return (
    modelNames.find((name) => {
      const normalized = name.toLowerCase();
      return !normalized.includes("embed") && !normalized.endsWith(":cloud");
    }) ?? null
  );
}

export async function detectOllamaEmbeddingModel(
  env: Record<string, string | undefined> = process.env,
  fetchImpl: OllamaFetchLike = fetch
): Promise<string | null | undefined> {
  const override = getOllamaEmbeddingModelOverride(env);
  if (override) {
    return override;
  }

  const modelNames = await getOllamaModelNames(env, fetchImpl);
  if (modelNames === null) {
    return undefined;
  }

  return (
    modelNames.find((name) => {
      const normalized = name.toLowerCase();
      return OLLAMA_EMBED_MODEL_KEYWORDS.some((keyword) => normalized.includes(keyword));
    }) ?? null
  );
}

export function resetOllamaTestState(): void {
  reachabilityCache.clear();
  tagsCache.clear();
}
