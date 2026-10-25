import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

/** An expected application error that should be returned to the client. */
export class AppError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "AppError";
  }
}

/** MongoDB uses error code 11000 when a unique index is violated. */
function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null &&
    "code" in error && error.code === 11000;
}

/** Pick a safe HTTP status, falling back to 500 for unexpected errors. */
function getStatus(error: unknown): number {
  if (isDuplicateKeyError(error)) return 409;
  if (error instanceof ZodError) return 400;

  if (typeof error === "object" && error !== null && "status" in error &&
      typeof error.status === "number" &&
      error.status >= 400 && error.status <= 599) {
    return error.status;
  }

  return 500;
}

/** Return useful messages for expected errors and hide internal details. */
function getClientMessage(error: unknown, status: number): string {
  if (isDuplicateKeyError(error)) return "Identifier already exists";
  if (error instanceof ZodError) return "Invalid input";
  if (error instanceof AppError && status < 500) return error.message;

  switch (status) {
    case 400: return "Invalid request";
    case 404: return "Route not found";
    case 413: return "Request too large";
    default:
      return status < 500
        ? "Request could not be completed"
        : "Internal server error";
  }
}

/** Express error middleware: normalize errors and avoid exposing server details. */
export const errorHandler: ErrorRequestHandler =
  (error: unknown, _req, res, next) => {
    // Let Express's default handler finish responses that have already started.
    if (res.headersSent) return next(error);

    const status = getStatus(error);
    if (status >= 500) console.error("Request failed", error);

    res.status(status).json({ error: getClientMessage(error, status) });
  };
