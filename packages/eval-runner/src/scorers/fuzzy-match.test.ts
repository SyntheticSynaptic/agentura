import assert from "node:assert/strict";
import test from "node:test";

import { scoreFuzzyMatch } from "./fuzzy-match";

test("scoreFuzzyMatch returns 1 for identical token sets", () => {
  assert.equal(scoreFuzzyMatch("3 projects free plan", "free plan 3 projects"), 1);
});

test("scoreFuzzyMatch returns intersection-over-union for partial overlap", () => {
  assert.equal(scoreFuzzyMatch("hello world from agentura", "hello world"), 0.5);
});

test("scoreFuzzyMatch returns 0 when the strings share no tokens", () => {
  assert.equal(scoreFuzzyMatch("billing settings", "refund policy"), 0);
});

test("scoreFuzzyMatch uses token overlap rather than edit distance", () => {
  assert.equal(scoreFuzzyMatch("billing", "billings"), 0);
  assert.equal(scoreFuzzyMatch("support plan", "support plans"), 1 / 3);
});

test("scoreFuzzyMatch handles empty strings", () => {
  assert.equal(scoreFuzzyMatch("", ""), 1);
  assert.equal(scoreFuzzyMatch("", "hello"), 0);
  assert.equal(scoreFuzzyMatch("hello", ""), 0);
});
