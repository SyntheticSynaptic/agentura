import { prisma } from "@agentura/db";
import { TRPCError } from "@trpc/server";
import { generateApiKey } from "../../lib/api-keys";
import { createTRPCRouter, protectedProcedure } from "../trpc";

interface CreateApiKeyInput {
  name: string;
}

interface RevokeApiKeyInput {
  id: string;
}

const createApiKeyInputParser = {
  parse(input: unknown): CreateApiKeyInput {
    if (!input || typeof input !== "object") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Input must include a key name",
      });
    }

    const record = input as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim() : "";

    if (!name) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Key name is required",
      });
    }

    if (name.length > 50) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Key name must be 50 characters or fewer",
      });
    }

    return { name };
  },
};

const revokeApiKeyInputParser = {
  parse(input: unknown): RevokeApiKeyInput {
    if (!input || typeof input !== "object") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Input must include id",
      });
    }

    const record = input as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id.trim() : "";

    if (!id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Input must include a non-empty id",
      });
    }

    return { id };
  },
};

export const apiKeysRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const keys = await prisma.apiKey.findMany({
      where: {
        userId: ctx.user.id,
        revokedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    return keys;
  }),

  create: protectedProcedure
    .input(createApiKeyInputParser)
    .mutation(async ({ ctx, input }) => {
      const { raw, hash, prefix } = generateApiKey();

      const created = await prisma.apiKey.create({
        data: {
          userId: ctx.user.id,
          name: input.name,
          keyHash: hash,
          keyPrefix: prefix,
        },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          createdAt: true,
        },
      });

      return {
        ...created,
        raw,
      };
    }),

  revoke: protectedProcedure
    .input(revokeApiKeyInputParser)
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.apiKey.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        select: {
          id: true,
          revokedAt: true,
        },
      });

      if (!existing || existing.revokedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key was not found",
        });
      }

      await prisma.apiKey.update({
        where: {
          id: existing.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      return { success: true as const };
    }),
});
