import express from "express";
import { env } from "./config/env.js";
import { authRouter } from "./auth/auth.js";
import { attachCurrentUser } from "./auth/current-user.js";
import { sameOriginWrites } from "./middleware/origin.js";
import { errorHandler } from "./middleware/errors.js";

import type { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { createContext, type GraphQLContext } from "./graphql/context.js";
import { healthRouter } from "./routes/health.routes.js";
import { documentationRouter } from "./routes/documentation.routes.js";

type AppOptions = { apollo: ApolloServer<GraphQLContext> };
export function createApp({ apollo }: AppOptions) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY_HOPS);
  app.use("/health", healthRouter);
  app.use("/docs", documentationRouter);
  app.get("/api-docs", (_req, res) => res.redirect(302, "/graphql"));
  app.use(sameOriginWrites);
  app.use(express.json({ limit: "32kb" }));
  if (env.AUTH_ENABLED) {
    app.use("/auth", authRouter);
    app.use(attachCurrentUser);
  } else {
    app.use((_req, res, next) => {
      res.locals.currentUser = null;
      next();
    });
  }
  app.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.get("/", (_req, res) => {
    const signedIn = Boolean(res.locals.currentUser);
    res.type("html").send(`<!doctype html>
    <html lang="en">
    <head><meta charset="utf-8">
    <title>Students GraphQL API</title>
    </head>
    <body><main>
    <nav><a href="/docs">API documentation</a> · <a href="/graphql">GraphQL Explorer</a></nav>
${!env.AUTH_ENABLED ? ''
    : signedIn ? '<form method="post" action="/auth/logout"><button>Sign out</button></form>'
    : '<p><a href="/auth/login">Sign in with Google</a></p>'}
</main></body></html>`);
  });
  app.use("/graphql", expressMiddleware(apollo, {
    context: createContext,
  }));
  app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
  app.use(errorHandler);
  return app;
}
