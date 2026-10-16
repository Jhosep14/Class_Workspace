import { Router } from "express";
import * as oidc from "openid-client";
import { z } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errors.js";
import { findOrCreateGoogleUser } from "./current-user.js";
import {
  getAppSession, getLoginTransaction, loginSchema,
  LOGIN_TTL_SECONDS, SESSION_TTL_SECONDS,
} from "./session.js";

export const GOOGLE_ISSUER = "https://accounts.google.com";
const callbackUrl = new URL("/auth/callback", env.BASE_URL);
let configuration: Promise<oidc.Configuration> | undefined;

function googleConfiguration(): Promise<oidc.Configuration> {
  // Discovery is cached after success; a transient outage can be retried.
  configuration ??= oidc.discovery(new URL(GOOGLE_ISSUER),
    env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, undefined, {
      timeout: 10, execute: [oidc.enableNonRepudiationChecks],
    })
    .catch(() => {
      configuration = undefined;
      throw new AppError(503, "Google sign-in is temporarily unavailable");
    });
  return configuration;
}

const identitySchema = z.object({
  iss: z.literal(GOOGLE_ISSUER),
  sub: z.string().min(1),
  name: z.string().max(200).optional(),
  email: z.email().optional(),
});

export const authRouter = Router();
authRouter.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("Referrer-Policy", "no-referrer");
  next();
});

authRouter.get("/login", async (req, res) => {
  const config = await googleConfiguration();
  const transaction = await getLoginTransaction(req, res);
  const verifier = oidc.randomPKCECodeVerifier();
  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const destination = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl.href,
    response_type: "code",
    scope: "openid profile email",
    code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
    code_challenge_method: "S256",
    state, nonce,
    prompt: "select_account",
  });
  Object.assign(transaction, {
    state, nonce, verifier,
    expiresAt: Date.now() + LOGIN_TTL_SECONDS * 1000,
  });
  await transaction.save();
  res.redirect(destination.href);
});

authRouter.get("/callback", async (req, res) => {
  const transaction = await getLoginTransaction(req, res);
  const parsed = loginSchema.safeParse({ ...transaction });
  // Consume the transaction on every callback, including denied/invalid logins.
  transaction.destroy();
  if (!parsed.success || parsed.data.expiresAt <= Date.now()) {
    throw new AppError(400, "Login expired or was not started here. Sign in again.");
  }
  const config = await googleConfiguration();
  // Use the configured public origin, never an incoming Host/proxy header.
  const receivedUrl = new URL(callbackUrl);
  receivedUrl.search = new URL(req.originalUrl, env.BASE_URL).search;
  let identity: z.infer<typeof identitySchema>;
  try {
    const tokens = await oidc.authorizationCodeGrant(config, receivedUrl, {
      pkceCodeVerifier: parsed.data.verifier,
      expectedState: parsed.data.state,
      expectedNonce: parsed.data.nonce,
      idTokenExpected: true,
    });
    // openid-client validates the ID token before claims are used.
    identity = identitySchema.parse(tokens.claims());
  } catch {
    // Avoid exposing authorization codes, tokens or provider error details.
    throw new AppError(400, "Google sign-in failed or was cancelled. Sign in again.");
  }
  const user = await findOrCreateGoogleUser(identity);
  const session = await getAppSession(req, res);
  session.userId = user._id.toString();
  session.expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  await session.save();
  // Google tokens are not persisted or sent to browser JavaScript.
  res.redirect(303, "/");
});

// app.ts mounts this router after the same-origin write check.
authRouter.post("/logout", async (req, res) => {
  (await getAppSession(req, res)).destroy();
  (await getLoginTransaction(req, res)).destroy();
  res.redirect(303, "/");
});
