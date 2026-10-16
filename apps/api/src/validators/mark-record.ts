import { z } from "zod";
import { studentId } from "./student.js";

const score = z.preprocess(value =>
  typeof value === "string" && value.trim() !== ""
    ? Number(value) : value,
  z.number().min(1).max(10));
export const scores = z.object({
  mathScore: score, scienceScore: score,
  englishScore: score, spanishScore: score,
}).strict();
export const newMarkRecord = scores.extend({ studentId });
export const updateMarkRecord = scores.partial().refine(
  value => Object.keys(value).length > 0, "Provide at least one score");
