import { env } from "../config/env.js";

import type { RequestHandler } from "express";

export const sameOriginWrites: RequestHandler = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.get("origin") !== new URL(env.BASE_URL).origin) {
    return res.status(403).send("Request origin is not allowed");
  }
  next();
};
