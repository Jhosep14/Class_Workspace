import mongoose from "mongoose";
import { connectMongo } from "../apps/api/src/db/mongoose.js";
import { StudentModel } from "../apps/api/src/modules/students/student.model.js";
import { MarkRecordModel } from
  "../apps/api/src/modules/mark-records/mark-record.model.js";
import { UserModel } from "../apps/api/src/modules/users/user.model.js";

try {
  await connectMongo();
  await StudentModel.createIndexes();
  await MarkRecordModel.createIndexes();
  await UserModel.createIndexes();
  console.log("Declared indexes created");
} catch (error) {
  console.error("Index preparation failed", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
