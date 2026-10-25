import http from "node:http";
import mongoose from "mongoose";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from
  "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from
  "@apollo/server/plugin/landingPage/default";
import { env } from "./apps/api/src/config/env.js";
import { connectMongo } from "./apps/api/src/db/mongoose.js";
import { createApp } from "./apps/api/src/app.js";
import { typeDefs, resolvers } from "./apps/api/src/graphql/schema.js";
import { formatGraphQLError } from "./apps/api/src/graphql/errors.js";
import type { GraphQLContext } from "./apps/api/src/graphql/context.js";

// Create HTTP server
const httpServer = http.createServer();

// Create Apollo Server
const apollo = new ApolloServer<GraphQLContext>({
  typeDefs, resolvers,
  stopOnTerminationSignals: false,
  includeStacktraceInErrorResponses: false,
  formatError: formatGraphQLError,
  introspection: true,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    ApolloServerPluginLandingPageLocalDefault({
      includeCookies: false,
      document: "query { students { id studentId name lastName grade } }",
      embed: { endpointIsEditable: false, runTelemetry: false },
    }),
  ],
});

// Shutdown logic
let closing = false;
let apolloStarted = false;
function reportShutdownFailure(error: unknown): void {
  console.error("Shutdown failed", error);
  process.exitCode = 1;
}
async function shutdown(): Promise<void> {
  if (closing) return;
  closing = true;
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  try { if (apolloStarted) await apollo.stop(); }
  finally {
    try { await mongoose.disconnect(); }
    finally { clearTimeout(deadline); }
  }
}

// Main startup code
try {
  // Connect to MongoDB
  await connectMongo();
  // Start Apollo Server
  await apollo.start();
  apolloStarted = true;
  // Create app
  httpServer.on("request", createApp({ apollo }));
  // Start HTTP server
  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(env.PORT, "0.0.0.0", () => {
      httpServer.off("error", reject);
      resolve();
    });
  });
  // Log startup information
  console.info(`Students API is listening on port ${env.PORT}; database Students-Data.`);
  console.info("API documentation: /docs");
  httpServer.on("error", error => {
    console.error("Listener failed", error);
    process.exitCode = 1;
    void shutdown().catch(reportShutdownFailure);
  });
  // Handle termination signals
  process.once("SIGTERM", () => void shutdown().catch(reportShutdownFailure));
  process.once("SIGINT", () => void shutdown().catch(reportShutdownFailure));
} catch (error) {
  console.error("Startup failed", error);
  process.exitCode = 1;
  await shutdown().catch(reportShutdownFailure);
}
