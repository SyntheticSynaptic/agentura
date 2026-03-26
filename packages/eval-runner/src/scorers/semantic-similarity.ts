import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import {
  detectOllamaEmbeddingModel,
  getOllamaBaseUrl,
  resetOllamaTestState,
  type OllamaFetchLike,
} from "./ollama";

export type SemanticSimilarityProvider =
  | "anthropic"
  | "openai"
  | "gemini"
  | "groq"
  | "ollama";

export interface ResolvedSemanticSimilarityProvider {
  provider: SemanticSimilarityProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export const NO_EMBEDDING_API_KEY_WARNING =
  "semantic_similarity scorer: set ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY, or install Ollama (https://ollama.com) to use embedding-based similarity; falling back to token overlap";
export const OLLAMA_EMBEDDING_MODEL_WARNING =
  "semantic_similarity: Ollama is running but no embedding model found. Install one with: ollama pull mxbai-embed-large\nOr set OLLAMA_EMBED_MODEL=your-model-name";

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

interface OllamaEmbeddingResponse {
  embedding?: number[];
  embeddings?: number[][];
}

interface OllamaEmbeddingClientLike {
  embeddings: {
    create(params: {
      model: string;
      prompt: string;
    }): Promise<OllamaEmbeddingResponse>;
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
type GroqEmbeddingClientFactory = (apiKey: string) => OpenAIEmbeddingClientLike;
type OllamaEmbeddingClientFactory = (baseUrl: string) => OllamaEmbeddingClientLike;

export interface SemanticSimilarityClientFactories {
  openai: OpenAIEmbeddingClientFactory;
  anthropic: AnthropicEmbeddingClientFactory;
  gemini: GeminiEmbeddingClientFactory;
  groq: GroqEmbeddingClientFactory;
  ollama: OllamaEmbeddingClientFactory;
}

const defaultOpenAIClientFactory: OpenAIEmbeddingClientFactory = (apiKey) =>
  new OpenAI({ apiKey }) as unknown as OpenAIEmbeddingClientLike;

const defaultGeminiClientFactory: GeminiEmbeddingClientFactory = (apiKey) =>
  new GoogleGenAI({ apiKey }) as unknown as GeminiEmbeddingClientLike;

const defaultGroqClientFactory: GroqEmbeddingClientFactory = (apiKey) =>
  new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  }) as unknown as OpenAIEmbeddingClientLike;

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

const defaultOllamaClientFactory: OllamaEmbeddingClientFactory = (baseUrl) => ({
  embeddings: {
    create: async ({ model, prompt }) => {
      const response = await fetch(`${baseUrl}/api/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `Ollama embeddings request failed: ${response.status} ${response.statusText} ${responseText}`.trim()
        );
      }

      return (await response.json()) as OllamaEmbeddingResponse;
    },
  },
});

const defaultClientFactories: SemanticSimilarityClientFactories = {
  openai: defaultOpenAIClientFactory,
  anthropic: defaultAnthropicClientFactory,
  gemini: defaultGeminiClientFactory,
  groq: defaultGroqClientFactory,
  ollama: defaultOllamaClientFactory,
};

const EMBEDDING_PROVIDER_PRIORITY: Array<{
  provider: SemanticSimilarityProvider;
  envVar: "ANTHROPIC_API_KEY" | "OPENAI_API_KEY" | "GEMINI_API_KEY" | "GROQ_API_KEY";
  model: string;
}> = [
  {
    provider: "anthropic",
    envVar: "ANTHROPIC_API_KEY",
    model: "voyage-3",
  },
  {
    provider: "openai",
    envVar: "OPENAI_API_KEY",
    model: "text-embedding-3-small",
  },
  {
    provider: "gemini",
    envVar: "GEMINI_API_KEY",
    model: "text-embedding-004",
  },
  {
    provider: "groq",
    envVar: "GROQ_API_KEY",
    model: "text-embedding-3-small",
  },
];

const embeddingCache = new Map<string, Promise<number[]>>();
let missingProviderWarningShown = false;
let missingOllamaEmbeddingModelWarningShown = false;
const providerFailureWarningsShown = new Set<SemanticSimilarityProvider>();
let ollamaSelectionLogShown = false;

export interface SemanticSimilarityResolverOptions {
  fetchImpl?: OllamaFetchLike;
  ollamaAvailable?: boolean;
}

interface SemanticSimilarityProviderResolution {
  provider: ResolvedSemanticSimilarityProvider | null;
  missingOllamaEmbeddingModel: boolean;
}

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

async function fetchGroqEmbedding(
  provider: ResolvedSemanticSimilarityProvider,
  text: string,
  clientFactories: SemanticSimilarityClientFactories
): Promise<number[]> {
  const client = clientFactories.groq(provider.apiKey);
  const response = await client.embeddings.create({
    model: provider.model,
    input: text,
    encoding_format: "float",
  });

  return readEmbedding(response.data?.[0]?.embedding, provider.provider);
}

async function fetchOllamaEmbedding(
  provider: ResolvedSemanticSimilarityProvider,
  text: string,
  clientFactories: SemanticSimilarityClientFactories
): Promise<number[]> {
  const client = clientFactories.ollama(provider.baseUrl ?? getOllamaBaseUrl());
  const response = await client.embeddings.create({
    model: provider.model,
    prompt: text,
  });

  return readEmbedding(response.embedding ?? response.embeddings?.[0], provider.provider);
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

  if (provider.provider === "gemini") {
    return fetchGeminiEmbedding(provider, text, clientFactories);
  }

  if (provider.provider === "groq") {
    return fetchGroqEmbedding(provider, text, clientFactories);
  }

  return fetchOllamaEmbedding(provider, text, clientFactories);
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

async function resolveSemanticSimilarityProviderWithState(
  env: Record<string, string | undefined> = process.env,
  options: SemanticSimilarityResolverOptions = {}
): Promise<SemanticSimilarityProviderResolution> {
  for (const candidate of EMBEDDING_PROVIDER_PRIORITY) {
    const apiKey = env[candidate.envVar]?.trim();
    if (apiKey) {
      return {
        provider: {
          provider: candidate.provider,
          apiKey,
          model: candidate.model,
        },
        missingOllamaEmbeddingModel: false,
      };
    }
  }

  if (options.ollamaAvailable === false) {
    return {
      provider: null,
      missingOllamaEmbeddingModel: false,
    };
  }

  const ollamaModel = await detectOllamaEmbeddingModel(env, options.fetchImpl);
  if (ollamaModel) {
    return {
      provider: {
        provider: "ollama",
        apiKey: "",
        model: ollamaModel,
        baseUrl: getOllamaBaseUrl(env),
      },
      missingOllamaEmbeddingModel: false,
    };
  }

  return {
    provider: null,
    missingOllamaEmbeddingModel: ollamaModel === null,
  };
}

export async function resolveSemanticSimilarityProvider(
  env: Record<string, string | undefined> = process.env,
  options: SemanticSimilarityResolverOptions = {}
): Promise<ResolvedSemanticSimilarityProvider | null> {
  return (await resolveSemanticSimilarityProviderWithState(env, options)).provider;
}

export function resetSemanticSimilarityTestState(): void {
  embeddingCache.clear();
  missingProviderWarningShown = false;
  missingOllamaEmbeddingModelWarningShown = false;
  providerFailureWarningsShown.clear();
  ollamaSelectionLogShown = false;
  resetOllamaTestState();
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

  const { provider, missingOllamaEmbeddingModel } =
    await resolveSemanticSimilarityProviderWithState(env);
  if (!provider) {
    if (missingOllamaEmbeddingModel) {
      if (!missingOllamaEmbeddingModelWarningShown) {
        console.warn(OLLAMA_EMBEDDING_MODEL_WARNING);
        missingOllamaEmbeddingModelWarningShown = true;
      }
    } else if (!missingProviderWarningShown) {
      console.warn(NO_EMBEDDING_API_KEY_WARNING);
      missingProviderWarningShown = true;
    }

    return fallbackTokenOverlapScore(output, expected);
  }

  if (provider.provider === "ollama" && !ollamaSelectionLogShown) {
    console.log(`semantic_similarity: using ollama (${provider.model}) [local]`);
    ollamaSelectionLogShown = true;
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
