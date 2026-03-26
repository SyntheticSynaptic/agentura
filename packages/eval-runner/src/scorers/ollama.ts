const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
const OLLAMA_REACHABILITY_TIMEOUT_MS = 1_000;

export type OllamaFetchLike = typeof fetch;

const reachabilityCache = new Map<string, Promise<boolean>>();

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

export function getOllamaJudgeModel(
  env: Record<string, string | undefined> = process.env
): string {
  return env.OLLAMA_MODEL?.trim() || "llama3.2";
}

export function getOllamaEmbeddingModel(
  env: Record<string, string | undefined> = process.env
): string {
  return env.OLLAMA_EMBED_MODEL?.trim() || "nomic-embed-text";
}

async function probeOllama(
  baseUrl: string,
  fetchImpl: OllamaFetchLike
): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_REACHABILITY_TIMEOUT_MS);

  try {
    const response = await fetchImpl(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });

    return response.status === 200;
  } catch {
    return false;
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

  const availabilityPromise = probeOllama(baseUrl, fetchImpl).catch(() => false);
  reachabilityCache.set(baseUrl, availabilityPromise);
  return availabilityPromise;
}

export function resetOllamaTestState(): void {
  reachabilityCache.clear();
}
