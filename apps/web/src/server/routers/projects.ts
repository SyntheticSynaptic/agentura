import { prisma } from "@agentura/db";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

interface ProjectLookupInput {
  owner: string;
  repo: string;
}

interface RunHistoryInput extends ProjectLookupInput {
  limit: number;
}

const projectLookupInputParser = {
  parse(input: unknown): ProjectLookupInput {
    return parseProjectLookupInput(input);
  },
};

const runHistoryInputParser = {
  parse(input: unknown): RunHistoryInput {
    return parseRunHistoryInput(input);
  },
};

function parseProjectLookupInput(input: unknown): ProjectLookupInput {
  if (!input || typeof input !== "object") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Input must be an object containing owner and repo",
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

function parseRunHistoryInput(input: unknown): RunHistoryInput {
  const { owner, repo } = parseProjectLookupInput(input);
  const record = input as Record<string, unknown>;
  const rawLimit = record.limit;
  const limit =
    typeof rawLimit === "number" && Number.isInteger(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, 100)
      : 20;

  return { owner, repo, limit };
}

function formatProject(project: {
  id: string;
  owner: string;
  repo: string;
  defaultBranch: string;
  evalRuns: Array<{
    status: string;
    overallPassed: boolean | null;
    createdAt: Date;
    branch: string;
  }>;
}) {
  const latestRun = project.evalRuns[0] ?? null;

  return {
    id: project.id,
    owner: project.owner,
    repo: project.repo,
    defaultBranch: project.defaultBranch,
    lastRun: latestRun
      ? {
          status: latestRun.status,
          overallPassed: latestRun.overallPassed,
          createdAt: latestRun.createdAt,
          branch: latestRun.branch,
        }
      : null,
  };
}

export const projectsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const projects = await prisma.project.findMany({
      where: {
        installation: {
          userId: ctx.user.id,
        },
      },
      orderBy: [{ owner: "asc" }, { repo: "asc" }],
      select: {
        id: true,
        owner: true,
        repo: true,
        defaultBranch: true,
        evalRuns: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            status: true,
            overallPassed: true,
            createdAt: true,
            branch: true,
          },
        },
      },
    });

    return projects.map(formatProject);
  }),

  getByOwnerRepo: protectedProcedure
    .input(projectLookupInputParser)
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
          owner: true,
          repo: true,
          defaultBranch: true,
          evalRuns: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              status: true,
              overallPassed: true,
              createdAt: true,
              branch: true,
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project was not found",
        });
      }

      return formatProject(project);
    }),

  getRunHistory: protectedProcedure
    .input(runHistoryInputParser)
    .query(async ({ ctx, input }) => {
      const { owner, repo, limit } = input;

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
        take: limit,
        select: {
          id: true,
          branch: true,
          commitSha: true,
          status: true,
          overallPassed: true,
          totalCases: true,
          passedCases: true,
          durationMs: true,
          estimatedCostUsd: true,
          createdAt: true,
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
              createdAt: true,
            },
          },
        },
      });

      return runs;
    }),
});
