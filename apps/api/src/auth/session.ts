import type { Request, Response } from "express";
import { getIronSession, type SessionOptions } from "iron-session";
import { z } from "zod";
import { env } from "../config/env.js";

export const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const LOGIN_TTL_SECONDS = 10 * 60;
const secure = env.NODE_ENV === "production";
const prefix = secure ? "__Host-" : "";

function options(name: string, ttl: number): SessionOptions {
  return {
    password: env.SESSION_SECRET,
    cookieName: `${prefix}${name}`,
    ttl,
    cookieOptions: {
      httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: ttl,
    },
  };
}

export const sessionSchema = z.object({
  userId: z.string().regex(/^[a-f0-9]{24}$/i),
  expiresAt: z.number().int().positive(),
}).strict();
type AppSession = z.infer<typeof sessionSchema>;

export const loginSchema = z.object({
  state: z.string().min(1),
  nonce: z.string().min(1),
  verifier: z.string().min(43).max(128),
  expiresAt: z.number().int().positive(),
}).strict();
type LoginTransaction = z.infer<typeof loginSchema>;

export function getAppSession(req: Request, res: Response) {
  return getIronSession<AppSession>(req, res,
    options("students_session", SESSION_TTL_SECONDS));
}

export function getLoginTransaction(req: Request, res: Response) {
  return getIronSession<LoginTransaction>(req, res,
    options("students_google_login", LOGIN_TTL_SECONDS));
}
