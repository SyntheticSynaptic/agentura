import { apiKeysRouter } from "./apiKeys";
import { billingRouter } from "./billing";
import { createTRPCRouter } from "../trpc";
import { projectsRouter } from "./projects";
import { runsRouter } from "./runs";
import { usersRouter } from "./users";

export const appRouter = createTRPCRouter({
  apiKeys: apiKeysRouter,
  billing: billingRouter,
  projects: projectsRouter,
  runs: runsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
