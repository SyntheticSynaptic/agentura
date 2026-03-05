import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@agentura/db";

import { compareToBaseline, getBaseline } from "./compare";

function assertAlmostEqual(actual: number | undefined, expected: number): void {
  assert.notEqual(actual, undefined);
  assert.ok(Math.abs((actual ?? 0) - expected) < 0.000001);
}

test("compareToBaseline does not flag regression when delta is within threshold", () => {
  const result = compareToBaseline(
    [{ suiteName: "accuracy", score: 0.87 }],
    {
      evalRun: {
        id: "baseline-1",
        completedAt: new Date(),
      },
      suiteResults: [{ suiteName: "accuracy", score: 0.9 }],
    },
    0.05
  );

  assert.equal(result.hasRegression, false);
  assert.deepEqual(result.regressions, []);
  assert.deepEqual(result.improvements, []);
  assert.deepEqual(result.unchanged, ["accuracy"]);
});

test("compareToBaseline flags regression when score drops more than threshold", () => {
  const result = compareToBaseline(
    [{ suiteName: "accuracy", score: 0.83 }],
    {
      evalRun: {
        id: "baseline-2",
        completedAt: new Date(),
      },
      suiteResults: [{ suiteName: "accuracy", score: 0.9 }],
    },
    0.05
  );

  assert.equal(result.hasRegression, true);
  assert.equal(result.regressions.length, 1);
  assert.equal(result.regressions[0]?.suiteName, "accuracy");
  assertAlmostEqual(result.regressions[0]?.delta, -0.07);
});

test("compareToBaseline flags improvement when score increases more than threshold", () => {
  const result = compareToBaseline(
    [{ suiteName: "quality", score: 0.92 }],
    {
      evalRun: {
        id: "baseline-3",
        completedAt: new Date(),
      },
      suiteResults: [{ suiteName: "quality", score: 0.75 }],
    },
    0.05
  );

  assert.equal(result.hasRegression, false);
  assert.equal(result.improvements.length, 1);
  assert.equal(result.improvements[0]?.suiteName, "quality");
  assertAlmostEqual(result.improvements[0]?.delta, 0.17);
});

test("compareToBaseline skips suites that do not exist in baseline", () => {
  const result = compareToBaseline(
    [{ suiteName: "new_suite", score: 0.7 }],
    {
      evalRun: {
        id: "baseline-4",
        completedAt: new Date(),
      },
      suiteResults: [{ suiteName: "accuracy", score: 0.9 }],
    },
    0.05
  );

  assert.equal(result.hasRegression, false);
  assert.deepEqual(result.regressions, []);
  assert.deepEqual(result.improvements, []);
  assert.deepEqual(result.unchanged, []);
});

test("getBaseline returns null when no completed baseline exists", async () => {
  const evalRunDelegate = prisma.evalRun as unknown as {
    findFirst: (args: unknown) => Promise<unknown>;
  };

  const originalFindFirst = evalRunDelegate.findFirst;
  evalRunDelegate.findFirst = async () => null;

  try {
    const baseline = await getBaseline("project-1");
    assert.equal(baseline, null);
  } finally {
    evalRunDelegate.findFirst = originalFindFirst;
  }
});
