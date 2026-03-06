import { prisma } from "@agentura/db";

export interface PendingToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
  apiKeyId?: string | null;
  apiKeyRaw?: string | null;
  fulfilledAt?: Date | null;
}

const TEN_MINUTES_MS = 10 * 60 * 1000;

export async function cleanExpiredTokens(): Promise<void> {
  await prisma.cliToken.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });
}

export async function createPendingToken(token: string): Promise<void> {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + TEN_MINUTES_MS);

  await prisma.cliToken.upsert({
    where: { token },
    update: {
      createdAt,
      expiresAt,
      fulfilledAt: null,
      apiKeyId: null,
      apiKeyRaw: null,
    },
    create: {
      token,
      createdAt,
      expiresAt,
    },
  });
}

export async function getPendingToken(token: string): Promise<PendingToken | undefined> {
  const entry = await prisma.cliToken.findFirst({
    where: {
      token,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      token: true,
      createdAt: true,
      expiresAt: true,
      fulfilledAt: true,
      apiKeyId: true,
      apiKeyRaw: true,
    },
  });

  if (!entry) {
    return undefined;
  }

  return entry;
}

export async function fulfillToken(token: string, apiKeyId: string, apiKeyRaw: string): Promise<void> {
  await prisma.cliToken.updateMany({
    where: {
      token,
      expiresAt: {
        gt: new Date(),
      },
    },
    data: {
      apiKeyId,
      apiKeyRaw,
      fulfilledAt: new Date(),
    },
  });
}

export async function deletePendingToken(token: string): Promise<void> {
  await prisma.cliToken.deleteMany({
    where: { token },
  });
}
