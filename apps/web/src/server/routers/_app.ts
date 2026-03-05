import { apiKeysRouter } from "./apiKeys";
import { createTRPCRouter } from "../trpc";
import { projectsRouter } from "./projects";
import { runsRouter } from "./runs";
import { usersRouter } from "./users";

export const appRouter = createTRPCRouter({
  apiKeys: apiKeysRouter,
  projects: projectsRouter,
  runs: runsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
