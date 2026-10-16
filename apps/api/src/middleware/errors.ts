import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const errorHandler: ErrorRequestHandler =
  (error: unknown, _req, res, next) => {
    if (res.headersSent) return next(error);
    const details = typeof error === "object" && error !== null ? error : {};
    const supplied = "status" in details && typeof details.status === "number"
      ? details.status : 500;
    const duplicate = "code" in details && details.code === 11000;
    const invalid = error instanceof ZodError;
    const status = duplicate ? 409 : invalid ? 400 :
      supplied >= 400 && supplied <= 599 ? supplied : 500;
    const message = duplicate ? "Identifier already exists" : invalid ?
      "Invalid input" : error instanceof AppError && status < 500 ? error.message :
      status === 400 ? "Invalid request" : status === 413 ? "Request too large" :
      status < 500 ? "Request could not be completed" : "Internal server error";
    if (status >= 500) console.error("Request failed", error);
    res.status(status).json({ error: message });
  };
