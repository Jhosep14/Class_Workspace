import type { RequestHandler } from "express";
import { UserModel } from "../modules/users/user.model.js";
import { getAppSession, sessionSchema } from "./session.js";

type GoogleIdentity = {
  iss: string; sub: string; name?: string; email?: string;
};

export async function findOrCreateGoogleUser(identity: GoogleIdentity) {
  const key = { issuer: identity.iss, subject: identity.sub };
  const user = await UserModel.findOneAndUpdate(key, {
    $set: { name: identity.name, email: identity.email },
  }, {
    upsert: true, returnDocument: "after", runValidators: true,
  }).lean().catch(async (error: unknown) => {
    if (typeof error !== "object" || error === null ||
        !("code" in error) || error.code !== 11000) throw error;
    return UserModel.findOne(key).lean();
  });
  if (!user) throw new Error("Application user could not be loaded");
  return user;
}

export const attachCurrentUser: RequestHandler = async (req, res, next) => {
  res.locals.currentUser = null;
  const session = await getAppSession(req, res);
  const parsed = sessionSchema.safeParse({ ...session });
  if (!parsed.success || parsed.data.expiresAt <= Date.now()) {
    if (Object.keys(session).length) session.destroy();
    return next();
  }
  // Confirm the local user still exists; deleting it prevents further access.
  const user = await UserModel.findOne({
    _id: parsed.data.userId, issuer: "https://accounts.google.com",
  }).select("_id").lean();
  if (user) res.locals.currentUser = { id: user._id.toString() };
  else session.destroy();
  next();
};
