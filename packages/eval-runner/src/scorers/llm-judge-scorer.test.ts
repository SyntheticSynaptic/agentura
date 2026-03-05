import assert from "node:assert/strict";
import test from "node:test";

import { scoreLlmJudge } from "./llm-judge-scorer";

type MockResponseText = string;

function createMockGroqFactory(responseText: MockResponseText) {
  return () => ({
    chat: {
      completions: {
        create: async () => ({
          choices: [
            {
              message: {
                content: responseText,
              },
            },
          ],
        }),
      },
    },
  });
}

test("scoreLlmJudge returns score and reason on successful response", async () => {
  const result = await scoreLlmJudge(
    "What is 2+2?",
    "It is 4",
    "Give full score for correct answers.",
    "test-key",
    createMockGroqFactory('{"score":0.9,"reason":"Correct and concise."}')
  );

  assert.equal(result.score, 0.9);
  assert.equal(result.reason, "Correct and concise.");
});

test("scoreLlmJudge returns parse error on invalid JSON", async () => {
  const result = await scoreLlmJudge(
    "Question",
    "Answer",
    "Rubric",
    "test-key",
    createMockGroqFactory("not-json")
  );

  assert.equal(result.score, 0);
  assert.equal(result.reason, "Judge response parse error");
});

test("scoreLlmJudge clamps score above 1 to 1", async () => {
  const result = await scoreLlmJudge(
    "Question",
    "Answer",
    "Rubric",
    "test-key",
    createMockGroqFactory('{"score":1.8,"reason":"Too high"}')
  );

  assert.equal(result.score, 1);
  assert.equal(result.reason, "Too high");
});

test("scoreLlmJudge clamps score below 0 to 0", async () => {
  const result = await scoreLlmJudge(
    "Question",
    "Answer",
    "Rubric",
    "test-key",
    createMockGroqFactory('{"score":-2,"reason":"Too low"}')
  );

  assert.equal(result.score, 0);
  assert.equal(result.reason, "Too low");
});
