import type { ComparisonResult } from "../baseline/compare";

export type CheckRunConclusion =
  | "success"
  | "failure"
  | "neutral"
  | "cancelled"
  | "timed_out"
  | "action_required"
  | "skipped";

interface CreateCheckRunResponse {
  data: {
    id: number;
  };
}

export interface ChecksOctokitLike {
  request(
    route: "POST /repos/{owner}/{repo}/check-runs",
    params: {
      owner: string;
      repo: string;
      name: string;
      head_sha: string;
      status: "queued" | "in_progress" | "completed";
      started_at?: string;
    }
  ): Promise<CreateCheckRunResponse>;
  request(
    route: "PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}",
    params: {
      owner: string;
      repo: string;
      check_run_id: number;
      status: "queued" | "in_progress" | "completed";
      conclusion?: CheckRunConclusion;
      completed_at?: string;
      output?: {
        title: string;
        summary: string;
        text?: string;
      };
    }
  ): Promise<unknown>;
}

export interface CheckRunOutcome {
  conclusion: CheckRunConclusion;
  summary: string;
}

interface DetermineCheckRunOutcomeInput {
  overallPassed: boolean;
  isPrRun: boolean;
  blockOnRegression: boolean;
  comparisonResult: ComparisonResult | null;
  baselineFound: boolean;
  passedSuites: number;
  totalSuites: number;
}

function formatDeltaPercent(delta: number): string {
  const rounded = Math.round(delta * 100);
  return `${rounded > 0 ? "+" : ""}${String(rounded)}%`;
}

export function determineCheckRunOutcome(
  input: DetermineCheckRunOutcomeInput
): CheckRunOutcome {
  const hasRegression = Boolean(input.comparisonResult?.hasRegression);
  const conclusion: CheckRunConclusion =
    input.blockOnRegression && hasRegression
      ? "failure"
      : input.overallPassed
        ? "success"
        : "failure";

  if (!input.isPrRun) {
    return {
      conclusion,
      summary: `${String(input.passedSuites)}/${String(input.totalSuites)} suites passed`,
    };
  }

  if (!input.baselineFound) {
    return {
      conclusion,
      summary: "First run — no baseline to compare against",
    };
  }

  if (hasRegression && input.comparisonResult && input.comparisonResult.regressions.length > 0) {
    const [firstRegression] = input.comparisonResult.regressions;
    return {
      conclusion,
      summary: `⚠️ Regression detected in ${firstRegression.suiteName}: ${formatDeltaPercent(firstRegression.delta)} vs baseline`,
    };
  }

  return {
    conclusion,
    summary: `${String(input.passedSuites)}/${String(input.totalSuites)} suites passed vs baseline`,
  };
}

export async function createCheckRun(
  octokit: ChecksOctokitLike,
  params: {
    owner: string;
    repo: string;
    commitSha: string;
  }
): Promise<number> {
  const response = await octokit.request("POST /repos/{owner}/{repo}/check-runs", {
    owner: params.owner,
    repo: params.repo,
    name: "Agentura Evals",
    head_sha: params.commitSha,
    status: "in_progress",
    started_at: new Date().toISOString(),
  });

  return response.data.id;
}

export async function updateCheckRun(
  octokit: ChecksOctokitLike,
  params: {
    owner: string;
    repo: string;
    checkRunId: number;
    conclusion: CheckRunConclusion;
    summary: string;
  }
): Promise<void> {
  await octokit.request("PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}", {
    owner: params.owner,
    repo: params.repo,
    check_run_id: params.checkRunId,
    status: "completed",
    conclusion: params.conclusion,
    completed_at: new Date().toISOString(),
    output: {
      title: "Agentura Evals",
      summary: params.summary,
    },
  });
}
