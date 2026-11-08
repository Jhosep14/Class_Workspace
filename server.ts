import http from "node:http";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from
  "@apollo/server/plugin/drainHttpServer";
import { connectMongo } from "./apps/api/src/db/mongoose.js";
import { createApp } from "./apps/api/src/app.js";
import { typeDefs, resolvers } from "./apps/api/src/graphql/schema.js";
import { formatGraphQLError } from "./apps/api/src/graphql/errors.js";
import { sessionSandbox } from "./apps/api/src/graphql/sandbox.js";
import type { GraphQLContext } from "./apps/api/src/graphql/context.js";

// Create HTTP server
const httpServer = http.createServer();

// Create Apollo Server
const apollo = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  includeStacktraceInErrorResponses: false,
  formatError: formatGraphQLError,
  introspection: true,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    sessionSandbox,
  ],
});

// Main startup code
try {
  // Connect to MongoDB
  await connectMongo();
  // Start Apollo Server
  await apollo.start();
  // Create app
  httpServer.on("request", createApp({ apollo }));
  // Start HTTP server
  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.API_HOST ?? "0.0.0.0";
  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(port, host, () => {
      httpServer.off("error", reject);
      resolve();
    });
  });

  // Log startup information
  console.info(`Students API is listening on port ${port}; database Students-Data.`);
  console.info("API documentation: /docs");
  httpServer.on("error", error => {
    console.error("Listener failed", error);
    process.exit(1);
  });
} catch (error) {
  console.error("Startup failed", error);
  process.exit(1);
}
