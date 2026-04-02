import { initTRPC } from "@trpc/server";
import superjson from "superjson";

const t = initTRPC.create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: "ok" };
  }),
  session: publicProcedure.query(() => {
    return { user: null };
  }),
});

export type AppRouter = typeof appRouter;
