import { prisma } from "@agentura/db";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

interface OwnerRepoInput {
  owner: string;
  repo: string;
}

interface RunByIdInput {
  runId: string;
}

const ownerRepoInputParser = {
  parse(input: unknown): OwnerRepoInput {
    return parseOwnerRepoInput(input);
  },
};

const runByIdInputParser = {
  parse(input: unknown): RunByIdInput {
    return parseRunByIdInput(input);
  },
};

function parseOwnerRepoInput(input: unknown): OwnerRepoInput {
  if (!input || typeof input !== "object") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Input must include owner and repo",
    });
  }

  const record = input as Record<string, unknown>;
  const owner = typeof record.owner === "string" ? record.owner.trim() : "";
  const repo = typeof record.repo === "string" ? record.repo.trim() : "";

  if (!owner || !repo) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Input must include non-empty owner and repo",
    });
  }

  return { owner, repo };
}

function parseRunByIdInput(input: unknown): RunByIdInput {
  if (!input || typeof input !== "object") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Input must include runId",
    });
  }

  const record = input as Record<string, unknown>;
  const runId = typeof record.runId === "string" ? record.runId.trim() : "";

  if (!runId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Input must include a non-empty runId",
    });
  }

  return { runId };
}

export const runsRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(runByIdInputParser)
    .query(async ({ ctx, input }) => {
      const { runId } = input;

      const run = await prisma.evalRun.findFirst({
        where: {
          id: runId,
          project: {
            installation: {
              userId: ctx.user.id,
            },
          },
        },
        select: {
          id: true,
          branch: true,
          commitSha: true,
          prNumber: true,
          status: true,
          githubCheckRunId: true,
          overallPassed: true,
          totalCases: true,
          passedCases: true,
          durationMs: true,
          estimatedCostUsd: true,
          createdAt: true,
          completedAt: true,
          project: {
            select: {
              id: true,
              owner: true,
              repo: true,
              defaultBranch: true,
            },
          },
          suiteResults: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              suiteName: true,
              strategy: true,
              score: true,
              threshold: true,
              passed: true,
              baselineScore: true,
              regressed: true,
              totalCases: true,
              passedCases: true,
              durationMs: true,
              metadata: true,
              createdAt: true,
              caseResults: {
                orderBy: {
                  caseIndex: "asc",
                },
                select: {
                  id: true,
                  caseIndex: true,
                  input: true,
                  output: true,
                  expected: true,
                  score: true,
                  passed: true,
                  judgeReason: true,
                  latencyMs: true,
                  errorMessage: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });

      if (!run) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Eval run was not found",
        });
      }

      return run;
    }),

  getStats: protectedProcedure
    .input(ownerRepoInputParser)
    .query(async ({ ctx, input }) => {
      const { owner, repo } = input;

      const project = await prisma.project.findFirst({
        where: {
          owner,
          repo,
          installation: {
            userId: ctx.user.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project was not found",
        });
      }

      const runs = await prisma.evalRun.findMany({
        where: {
          projectId: project.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        select: {
          id: true,
          status: true,
          overallPassed: true,
          createdAt: true,
          branch: true,
        },
      });

      return runs;
    }),
});
