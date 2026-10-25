import { GraphQLError, type GraphQLFormattedError } from "graphql";
import { ZodError } from "zod";
import { AppError } from "../middleware/errors.js";

/** Translate expected application HTTP statuses into GraphQL error codes. */
const applicationCodes: Record<number, string> = {
  400: "BAD_USER_INPUT",
  404: "NOT_FOUND",
  409: "CONFLICT",
};

/** Convert service errors into safe, client-readable GraphQL errors. */
export async function handleGraphQLError<T>(
  work: () => PromiseLike<T>,
): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof ZodError) {
      throw new GraphQLError("Invalid input", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    if (error instanceof AppError) {
      const code = applicationCodes[error.status];
      if (code) {
        throw new GraphQLError(error.message, { extensions: { code } });
      }
    }

    if (isDuplicateKeyError(error)) {
      throw new GraphQLError("Identifier already exists", {
        extensions: { code: "CONFLICT" },
      });
    }

    // Leave unexpected failures for formatGraphQLError to log and mask.
    throw error;
  }
}

/** Recognize the duplicate-key error returned by MongoDB. */
function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null &&
    "code" in error && error.code === 11000;
}

/** Codes that are safe to include in a client response. */
const publicCodes = new Set([
  "BAD_USER_INPUT",
  "NOT_FOUND",
  "CONFLICT",
  "GRAPHQL_PARSE_FAILED",
  "GRAPHQL_VALIDATION_FAILED",
  "BAD_REQUEST",
  "OPERATION_RESOLUTION_FAILURE",
  "PERSISTED_QUERY_NOT_FOUND",
  "PERSISTED_QUERY_NOT_SUPPORTED",
]);

/** Keep known GraphQL errors; log and mask unexpected server failures. */
export function formatGraphQLError(
  formatted: GraphQLFormattedError,
  original: unknown,
): GraphQLFormattedError {
  const code = formatted.extensions?.code;

  if (typeof code === "string" && publicCodes.has(code)) {
    return {
      message: formatted.message,
      locations: formatted.locations,
      path: formatted.path,
      extensions: { code },
    };
  }

  console.error("GraphQL request failed", original);
  return {
    message: "Internal server error",
    locations: formatted.locations,
    path: formatted.path,
    extensions: { code: "INTERNAL_SERVER_ERROR" },
  };
}
