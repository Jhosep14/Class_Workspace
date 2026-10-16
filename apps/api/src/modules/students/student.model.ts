import { Schema, model, type InferSchemaType } from "mongoose";

const studentSchema = new Schema({
  studentId: { type: String, required: true, immutable: true },
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  sex: { type: String, required: true },
  age: { type: Number, required: true, min: 0, max: 120 },
  class: { type: String, required: true },
  grade: { type: Number, required: true, min: 1, max: 12 },
  dob: { type: String, required: true },
  profileImageKey: { type: String, default: null },
  relationVersion: { type: Number, default: 0 },
}, { collection: "students" });
studentSchema.index({ studentId: 1 }, { unique: true });
export type Student = InferSchemaType<typeof studentSchema>;
export const StudentModel = model("Student", studentSchema);
