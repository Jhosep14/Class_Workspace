import { z } from "zod";
import { studentId } from "./student.js";

// Accept numeric strings from clients and require scores from 1 through 10.
const score = z.preprocess(
  value => typeof value === "string" && value.trim() !== ""
    ? Number(value)
    : value,
  z.number().min(1).max(10),
);

// A score record must contain one score per subject and no extra fields.
export const scores = z.object({
  mathScore: score,
  scienceScore: score,
  englishScore: score,
  spanishScore: score,
}).strict();

// Creation requires scores for all subjects and the associated student ID.
export const newMarkRecord = scores.extend({ studentId });

// Updates may change any subset of scores, but cannot be empty.
export const updateMarkRecord = scores.partial().refine(
  value => Object.keys(value).length > 0,
  "Provide at least one score",
);
