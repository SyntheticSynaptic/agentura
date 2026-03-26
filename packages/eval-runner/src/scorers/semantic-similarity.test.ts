import assert from "node:assert/strict";
import test from "node:test";

import type { SemanticSimilarityClientFactories } from "./semantic-similarity";
import {
  NO_EMBEDDING_API_KEY_WARNING,
  resetSemanticSimilarityTestState,
  resolveSemanticSimilarityProvider,
  scoreSemanticSimilarity,
} from "./semantic-similarity";

function withConsoleWarnings(callback: (warnings: string[]) => Promise<void>): Promise<void> {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args.map((value) => String(value)).join(" "));
  };

  return callback(warnings).finally(() => {
    console.warn = originalWarn;
  });
}

function createClientFactories(
  embeddings: Record<"openai" | "anthropic" | "gemini", Record<string, number[]>>,
  onCall?: (provider: "openai" | "anthropic" | "gemini", input: string, model: string) => void
): SemanticSimilarityClientFactories {
  return {
    openai: () => ({
      embeddings: {
        create: async ({ input, model }) => {
          onCall?.("openai", input, model);
          return {
            data: [{ embedding: embeddings.openai[input] }],
          };
        },
      },
    }),
    anthropic: () => ({
      embeddings: {
        create: async ({ input, model }) => {
          onCall?.("anthropic", input, model);
          return {
            data: [{ embedding: embeddings.anthropic[input] }],
          };
        },
      },
    }),
    gemini: () => ({
      models: {
        embedContent: async ({ contents, model }) => {
          const input = contents[0] ?? "";
          onCall?.("gemini", input, model);
          return {
            embeddings: [{ values: embeddings.gemini[input] }],
          };
        },
      },
    }),
  };
}

test("resolveSemanticSimilarityProvider prefers OpenAI over other available providers", async () => {
  resetSemanticSimilarityTestState();

  assert.deepEqual(
    resolveSemanticSimilarityProvider({
      OPENAI_API_KEY: "openai-key",
      ANTHROPIC_API_KEY: "anthropic-key",
      GEMINI_API_KEY: "gemini-key",
    }),
    {
      provider: "openai",
      apiKey: "openai-key",
      model: "text-embedding-3-small",
    }
  );
});

test("scoreSemanticSimilarity returns cosine similarity for OpenAI embeddings and caches repeated inputs", async () => {
  resetSemanticSimilarityTestState();

  const calls: Array<{ provider: string; input: string; model: string }> = [];
  const factories = createClientFactories(
    {
      openai: {
        "semantic answer": [0.8, 0.6],
        expected: [1, 0],
      },
      anthropic: {},
      gemini: {},
    },
    (provider, input, model) => {
      calls.push({ provider, input, model });
    }
  );

  const env = { OPENAI_API_KEY: "openai-key" };
  const firstScore = await scoreSemanticSimilarity("semantic answer", "expected", env, factories);
  const secondScore = await scoreSemanticSimilarity("semantic answer", "expected", env, factories);

  assert.equal(firstScore, 0.8);
  assert.equal(secondScore, 0.8);
  assert.deepEqual(calls, [
    {
      provider: "openai",
      input: "semantic answer",
      model: "text-embedding-3-small",
    },
    {
      provider: "openai",
      input: "expected",
      model: "text-embedding-3-small",
    },
  ]);
});

test("scoreSemanticSimilarity selects the Voyage model for the Anthropic provider path", async () => {
  resetSemanticSimilarityTestState();

  const calls: Array<{ provider: string; input: string; model: string }> = [];
  const factories = createClientFactories(
    {
      openai: {},
      anthropic: {
        "agent output": [1, 0],
        expected: [0, 1],
      },
      gemini: {},
    },
    (provider, input, model) => {
      calls.push({ provider, input, model });
    }
  );

  const score = await scoreSemanticSimilarity(
    "agent output",
    "expected",
    { ANTHROPIC_API_KEY: "anthropic-key" },
    factories
  );

  assert.equal(score, 0);
  assert.deepEqual(calls, [
    {
      provider: "anthropic",
      input: "agent output",
      model: "voyage-3",
    },
    {
      provider: "anthropic",
      input: "expected",
      model: "voyage-3",
    },
  ]);
});

test("scoreSemanticSimilarity selects Gemini embeddings when only GEMINI_API_KEY is available", async () => {
  resetSemanticSimilarityTestState();

  const calls: Array<{ provider: string; input: string; model: string }> = [];
  const factories = createClientFactories(
    {
      openai: {},
      anthropic: {},
      gemini: {
        actual: [1, 0],
        expected: [1, 0],
      },
    },
    (provider, input, model) => {
      calls.push({ provider, input, model });
    }
  );

  const score = await scoreSemanticSimilarity(
    "actual",
    "expected",
    { GEMINI_API_KEY: "gemini-key" },
    factories
  );

  assert.equal(score, 1);
  assert.deepEqual(calls, [
    {
      provider: "gemini",
      input: "actual",
      model: "text-embedding-004",
    },
    {
      provider: "gemini",
      input: "expected",
      model: "text-embedding-004",
    },
  ]);
});

test("scoreSemanticSimilarity warns once and falls back to token overlap when no embedding key is present", async () => {
  resetSemanticSimilarityTestState();

  await withConsoleWarnings(async (warnings) => {
    const firstScore = await scoreSemanticSimilarity("hello world from agentura", "hello world", {});
    const secondScore = await scoreSemanticSimilarity("hello world from agentura", "hello world", {});

    assert.ok(firstScore > 0 && firstScore < 1);
    assert.equal(secondScore, firstScore);
    assert.deepEqual(warnings, [NO_EMBEDDING_API_KEY_WARNING]);
  });
});

test("scoreSemanticSimilarity falls back to token overlap if the embedding request fails", async () => {
  resetSemanticSimilarityTestState();

  const factories: SemanticSimilarityClientFactories = {
    openai: () => ({
      embeddings: {
        create: async () => {
          throw new Error("boom");
        },
      },
    }),
    anthropic: () => ({
      embeddings: {
        create: async () => ({ data: [{ embedding: [1] }] }),
      },
    }),
    gemini: () => ({
      models: {
        embedContent: async () => ({ embeddings: [{ values: [1] }] }),
      },
    }),
  };

  await withConsoleWarnings(async (warnings) => {
    const score = await scoreSemanticSimilarity(
      "The free plan includes 3 projects.",
      "3 projects",
      { OPENAI_API_KEY: "openai-key" },
      factories
    );

    assert.ok(score > 0 && score < 1);
    assert.equal(warnings.length, 1);
    assert.match(
      warnings[0] ?? "",
      /semantic_similarity scorer: openai embeddings unavailable \(boom\); falling back to token overlap/
    );
  });
});

test("scoreSemanticSimilarity handles empty strings without embedding calls", async () => {
  resetSemanticSimilarityTestState();

  assert.equal(await scoreSemanticSimilarity("", "", {}), 1);
  assert.equal(await scoreSemanticSimilarity("", "non-empty", {}), 0);
  assert.equal(await scoreSemanticSimilarity("non-empty", "", {}), 0);
});
