import { Schema, model } from "mongoose";

const userSchema = new Schema({
  issuer: { type: String, required: true },
  subject: { type: String, required: true },
  name: String,
  email: String,
}, { collection: "users" });
userSchema.index({ issuer: 1, subject: 1 }, { unique: true });
export const UserModel = model("User", userSchema);
