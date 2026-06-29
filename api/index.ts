import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { trpcServer } from "@trpc/server/adapters/fetch";
import { appRouter } from "../api/router";
import { createContext } from "../api/context";

const app = new Hono();

app.use(logger());
app.use(cors({ origin: "*" }));

app.get("/health", (c) => c.json({ ok: true }));

app.use("/trpc/*", async (c) => {
  return trpcServer({
    router: appRouter,
    createContext: async (opts) => createContext({ ...opts, req: c.req.raw }),
  })(c.req.raw);
});

app.get("/oauth/callback", (c) => c.json({ error: "Use Supabase Auth" }, 400));

export default app;

export const config = { runtime: "edge" };
