import http from "node:http";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from
  "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from
  "@apollo/server/plugin/landingPage/default";
import { connectMongo } from "./apps/api/src/db/mongoose.js";
import { createApp } from "./apps/api/src/app.js";
import { typeDefs, resolvers } from "./apps/api/src/graphql/schema.js";
import { formatGraphQLError } from "./apps/api/src/graphql/errors.js";
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
    // Keep Apollo Sandbox available on Render so authenticated demos can run operations.
    ApolloServerPluginLandingPageLocalDefault({
      embed: true,
      includeCookies: true,
    }),
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
  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(port, "0.0.0.0", () => {
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
