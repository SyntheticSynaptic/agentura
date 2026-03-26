import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export type SemanticSimilarityProvider = "openai" | "anthropic" | "gemini";

export interface ResolvedSemanticSimilarityProvider {
  provider: SemanticSimilarityProvider;
  apiKey: string;
  model: string;
}

export const NO_EMBEDDING_API_KEY_WARNING =
  "semantic_similarity scorer: set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY to use embedding-based similarity; falling back to token overlap";

interface OpenAIEmbeddingResponse {
  data?: Array<{
    embedding?: number[];
  }>;
}

interface OpenAIEmbeddingClientLike {
  embeddings: {
    create(params: {
      model: string;
      input: string;
      encoding_format?: "float";
    }): Promise<OpenAIEmbeddingResponse>;
  };
}

interface GeminiEmbeddingResponse {
  embeddings?: Array<{
    values?: number[];
  }>;
}

interface GeminiEmbeddingClientLike {
  models: {
    embedContent(params: {
      model: string;
      contents: string[];
    }): Promise<GeminiEmbeddingResponse>;
  };
}

interface VoyageEmbeddingResponse {
  data?: Array<{
    embedding?: number[];
  }>;
}

interface AnthropicEmbeddingClientLike {
  embeddings: {
    create(params: {
      model: string;
      input: string;
    }): Promise<VoyageEmbeddingResponse>;
  };
}

type OpenAIEmbeddingClientFactory = (apiKey: string) => OpenAIEmbeddingClientLike;
type GeminiEmbeddingClientFactory = (apiKey: string) => GeminiEmbeddingClientLike;
type AnthropicEmbeddingClientFactory = (apiKey: string) => AnthropicEmbeddingClientLike;

export interface SemanticSimilarityClientFactories {
  openai: OpenAIEmbeddingClientFactory;
  anthropic: AnthropicEmbeddingClientFactory;
  gemini: GeminiEmbeddingClientFactory;
}

const defaultOpenAIClientFactory: OpenAIEmbeddingClientFactory = (apiKey) =>
  new OpenAI({ apiKey }) as unknown as OpenAIEmbeddingClientLike;

const defaultGeminiClientFactory: GeminiEmbeddingClientFactory = (apiKey) =>
  new GoogleGenAI({ apiKey }) as unknown as GeminiEmbeddingClientLike;

const defaultAnthropicClientFactory: AnthropicEmbeddingClientFactory = (apiKey) => ({
  embeddings: {
    create: async ({ input, model }) => {
      const response = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: [input],
          model,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `Voyage embeddings request failed: ${response.status} ${response.statusText} ${responseText}`.trim()
        );
      }

      return (await response.json()) as VoyageEmbeddingResponse;
    },
  },
});

const defaultClientFactories: SemanticSimilarityClientFactories = {
  openai: defaultOpenAIClientFactory,
  anthropic: defaultAnthropicClientFactory,
  gemini: defaultGeminiClientFactory,
};

const EMBEDDING_PROVIDER_PRIORITY: Array<{
  provider: SemanticSimilarityProvider;
  envVar: "OPENAI_API_KEY" | "ANTHROPIC_API_KEY" | "GEMINI_API_KEY";
  model: string;
}> = [
  {
    provider: "openai",
    envVar: "OPENAI_API_KEY",
    model: "text-embedding-3-small",
  },
  {
    provider: "anthropic",
    envVar: "ANTHROPIC_API_KEY",
    model: "voyage-3",
  },
  {
    provider: "gemini",
    envVar: "GEMINI_API_KEY",
    model: "text-embedding-004",
  },
];

const embeddingCache = new Map<string, Promise<number[]>>();
let missingProviderWarningShown = false;
const providerFailureWarningsShown = new Set<SemanticSimilarityProvider>();

function tokenize(text: string): Set<string> {
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g);
  return new Set(tokens ?? []);
}

function fallbackTokenOverlapScore(output: string, expected: string): number {
  const outputTokens = tokenize(output);
  const expectedTokens = tokenize(expected);

  if (outputTokens.size === 0 && expectedTokens.size === 0) {
    return 1;
  }

  if (outputTokens.size === 0 || expectedTokens.size === 0) {
    return 0;
  }

  let intersectionSize = 0;
  for (const token of outputTokens) {
    if (expectedTokens.has(token)) {
      intersectionSize += 1;
    }
  }

  const unionSize = new Set([...outputTokens, ...expectedTokens]).size;
  return unionSize === 0 ? 1 : intersectionSize / unionSize;
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(1, score));
}

function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  if (left.length !== right.length) {
    throw new Error("Embedding vectors must be the same length");
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return clampScore(dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude)));
}

function readEmbedding(values: number[] | undefined, provider: SemanticSimilarityProvider): number[] {
  if (!values || values.length === 0) {
    throw new Error(`${provider} embeddings response did not include embedding values`);
  }

  return values;
}

async function fetchOpenAIEmbedding(
  provider: ResolvedSemanticSimilarityProvider,
  text: string,
  clientFactories: SemanticSimilarityClientFactories
): Promise<number[]> {
  const client = clientFactories.openai(provider.apiKey);
  const response = await client.embeddings.create({
    model: provider.model,
    input: text,
    encoding_format: "float",
  });

  return readEmbedding(response.data?.[0]?.embedding, provider.provider);
}

async function fetchAnthropicEmbedding(
  provider: ResolvedSemanticSimilarityProvider,
  text: string,
  clientFactories: SemanticSimilarityClientFactories
): Promise<number[]> {
  const client = clientFactories.anthropic(provider.apiKey);
  const response = await client.embeddings.create({
    model: provider.model,
    input: text,
  });

  return readEmbedding(response.data?.[0]?.embedding, provider.provider);
}

async function fetchGeminiEmbedding(
  provider: ResolvedSemanticSimilarityProvider,
  text: string,
  clientFactories: SemanticSimilarityClientFactories
): Promise<number[]> {
  const client = clientFactories.gemini(provider.apiKey);
  const response = await client.models.embedContent({
    model: provider.model,
    contents: [text],
  });

  return readEmbedding(response.embeddings?.[0]?.values, provider.provider);
}

async function fetchEmbedding(
  provider: ResolvedSemanticSimilarityProvider,
  text: string,
  clientFactories: SemanticSimilarityClientFactories
): Promise<number[]> {
  if (provider.provider === "openai") {
    return fetchOpenAIEmbedding(provider, text, clientFactories);
  }

  if (provider.provider === "anthropic") {
    return fetchAnthropicEmbedding(provider, text, clientFactories);
  }

  return fetchGeminiEmbedding(provider, text, clientFactories);
}

async function getCachedEmbedding(
  provider: ResolvedSemanticSimilarityProvider,
  text: string,
  clientFactories: SemanticSimilarityClientFactories
): Promise<number[]> {
  const cacheKey = `${provider.provider}:${provider.model}:${text}`;
  const cached = embeddingCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const embeddingPromise = fetchEmbedding(provider, text, clientFactories).catch((error) => {
    embeddingCache.delete(cacheKey);
    throw error;
  });

  embeddingCache.set(cacheKey, embeddingPromise);
  return embeddingPromise;
}

export function resolveSemanticSimilarityProvider(
  env: Record<string, string | undefined> = process.env
): ResolvedSemanticSimilarityProvider | null {
  for (const candidate of EMBEDDING_PROVIDER_PRIORITY) {
    const apiKey = env[candidate.envVar]?.trim();
    if (apiKey) {
      return {
        provider: candidate.provider,
        apiKey,
        model: candidate.model,
      };
    }
  }

  return null;
}

export function resetSemanticSimilarityTestState(): void {
  embeddingCache.clear();
  missingProviderWarningShown = false;
  providerFailureWarningsShown.clear();
}

export async function scoreSemanticSimilarity(
  output: string,
  expected: string,
  env: Record<string, string | undefined> = process.env,
  clientFactories: SemanticSimilarityClientFactories = defaultClientFactories
): Promise<number> {
  if (output.trim().length === 0 && expected.trim().length === 0) {
    return 1;
  }

  if (output.trim().length === 0 || expected.trim().length === 0) {
    return 0;
  }

  const provider = resolveSemanticSimilarityProvider(env);
  if (!provider) {
    if (!missingProviderWarningShown) {
      console.warn(NO_EMBEDDING_API_KEY_WARNING);
      missingProviderWarningShown = true;
    }

    return fallbackTokenOverlapScore(output, expected);
  }

  const [outputEmbedding, expectedEmbedding] = await Promise.all([
    getCachedEmbedding(provider, output, clientFactories),
    getCachedEmbedding(provider, expected, clientFactories),
  ]).catch((error: unknown) => {
    if (!providerFailureWarningsShown.has(provider.provider)) {
      console.warn(
        `semantic_similarity scorer: ${provider.provider} embeddings unavailable (${error instanceof Error ? error.message : "Unknown error"}); falling back to token overlap`
      );
      providerFailureWarningsShown.add(provider.provider);
    }

    return [null, null] as const;
  });

  if (!outputEmbedding || !expectedEmbedding) {
    return fallbackTokenOverlapScore(output, expected);
  }

  return cosineSimilarity(outputEmbedding, expectedEmbedding);
}
