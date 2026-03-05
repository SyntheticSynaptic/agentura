import { prisma } from "@agentura/db";

interface ScoredSuite {
  suiteName: string;
  score: number;
}

export interface BaselineEvalRun {
  id: string;
  completedAt: Date | null;
}

export interface BaselineResult {
  evalRun: BaselineEvalRun;
  suiteResults: ScoredSuite[];
}

export interface RegressionDetail {
  suiteName: string;
  baselineScore: number;
  currentScore: number;
  delta: number;
}

export interface ImprovementDetail {
  suiteName: string;
  baselineScore: number;
  currentScore: number;
  delta: number;
}

export interface ComparisonResult {
  hasRegression: boolean;
  regressions: RegressionDetail[];
  improvements: ImprovementDetail[];
  unchanged: string[];
}

export async function getBaseline(projectId: string): Promise<BaselineResult | null> {
  console.log("[debug] getBaseline querying for projectId:", projectId);

  const result = await prisma.evalRun.findFirst({
    where: {
      projectId,
      status: "completed",
      prNumber: null,
    },
    orderBy: {
      completedAt: "desc",
    },
    include: {
      suiteResults: {
        select: {
          suiteName: true,
          score: true,
        },
      },
    },
  });

  console.log("[debug] getBaseline result:", result ? result.id : "null");

  if (!result) {
    return null;
  }

  return {
    evalRun: {
      id: result.id,
      completedAt: result.completedAt,
    },
    suiteResults: result.suiteResults,
  };
}

export function compareToBaseline(
  currentSuites: ScoredSuite[],
  baseline: BaselineResult,
  regressionThreshold: number
): ComparisonResult {
  const regressions: RegressionDetail[] = [];
  const improvements: ImprovementDetail[] = [];
  const unchanged: string[] = [];

  for (const currentSuite of currentSuites) {
    const baselineSuite = baseline.suiteResults.find(
      (suite) => suite.suiteName === currentSuite.suiteName
    );

    if (!baselineSuite) {
      continue;
    }

    const delta = currentSuite.score - baselineSuite.score;
    if (delta < -regressionThreshold) {
      regressions.push({
        suiteName: currentSuite.suiteName,
        baselineScore: baselineSuite.score,
        currentScore: currentSuite.score,
        delta,
      });
      continue;
    }

    if (delta > regressionThreshold) {
      improvements.push({
        suiteName: currentSuite.suiteName,
        baselineScore: baselineSuite.score,
        currentScore: currentSuite.score,
        delta,
      });
      continue;
    }

    unchanged.push(currentSuite.suiteName);
  }

  return {
    hasRegression: regressions.length > 0,
    regressions,
    improvements,
    unchanged,
  };
}
