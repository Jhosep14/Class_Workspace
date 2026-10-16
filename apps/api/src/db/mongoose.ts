import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connectMongo(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: false,
    autoCreate: false,
  });
}
