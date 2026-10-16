import { Schema, model } from "mongoose";

const score = { type: Number, required: true, min: 1, max: 10 };
const markRecordSchema = new Schema({
  studentId: { type: String, required: true, immutable: true },
  mathScore: score, scienceScore: score,
  englishScore: score, spanishScore: score,
  averageScore: score,
}, { collection: "markRecords" });
markRecordSchema.index({ studentId: 1 }, { unique: true });
export const MarkRecordModel = model("MarkRecord", markRecordSchema);
