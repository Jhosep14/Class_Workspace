import { GraphQLError, type GraphQLFormattedError } from "graphql";
import { ZodError } from "zod";
import { AppError } from "../middleware/errors.js";
import type { GraphQLContext } from "./context.js";
import { env } from "../config/env.js";

const applicationCodes: Record<number, string> = {
  400: "BAD_USER_INPUT", 401: "UNAUTHENTICATED", 403: "FORBIDDEN",
  404: "NOT_FOUND", 409: "CONFLICT",
};
export async function authorized<T>(context: GraphQLContext,
  work: () => PromiseLike<T>): Promise<T> {
  if (env.AUTH_ENABLED && !context.currentUser) throw new GraphQLError("Sign in first", {
    extensions: { code: "UNAUTHENTICATED" },
  });
  try { return await work(); }
  catch (error) {
    if (error instanceof ZodError) throw new GraphQLError("Invalid input", {
      extensions: { code: "BAD_USER_INPUT" },
    });
    if (error instanceof AppError && applicationCodes[error.status]) {
      throw new GraphQLError(error.message, {
        extensions: { code: applicationCodes[error.status] },
      });
    }
    if (typeof error === "object" && error && "code" in error &&
      error.code === 11000) throw new GraphQLError("Identifier already exists", {
      extensions: { code: "CONFLICT" },
    });
    // Final Apollo formatting logs and masks unexpected failures.
    throw error;
  }
}

const publicCodes = new Set([
  "UNAUTHENTICATED", "FORBIDDEN", "BAD_USER_INPUT", "NOT_FOUND", "CONFLICT",
  "GRAPHQL_PARSE_FAILED", "GRAPHQL_VALIDATION_FAILED", "BAD_REQUEST",
  "OPERATION_RESOLUTION_FAILURE", "PERSISTED_QUERY_NOT_FOUND",
  "PERSISTED_QUERY_NOT_SUPPORTED",
]);
export function formatGraphQLError(formatted: GraphQLFormattedError,
  original: unknown): GraphQLFormattedError {
  const code = formatted.extensions?.code;
  if (typeof code === "string" && publicCodes.has(code)) {
    return {
      message: formatted.message, locations: formatted.locations,
      path: formatted.path, extensions: { code },
    };
  }
  console.error("GraphQL request failed", original);
  return {
    message: "Internal server error", locations: formatted.locations,
    path: formatted.path, extensions: { code: "INTERNAL_SERVER_ERROR" },
  };
}
