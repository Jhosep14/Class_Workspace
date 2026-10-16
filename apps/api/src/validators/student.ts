import { z } from "zod";

export const studentId = z.string().regex(/^S\d{3}$/);
const numeric = z.preprocess(value =>
  typeof value === "string" && value.trim() !== ""
    ? Number(value) : value,
  z.number().int());
const dob = z.string().regex(/^\d{2}-\d{2}-\d{2}$/).refine(value => {
  const [month, day, yy] = value.split("-").map(Number);
  const year = yy <= 29 ? 2000 + yy : 1900 + yy;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 && date.getUTCDate() === day &&
    date.getTime() <= Date.now();
}, "Use a real, non-future date in MM-DD-YY format");
const fields = z.object({
  name: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  sex: z.string().trim().min(1).max(40),
  age: numeric.pipe(z.number().min(0).max(120)),
  class: z.string().trim().min(1).max(20),
  grade: numeric.pipe(z.number().min(1).max(12)),
  dob,
  profileImageKey: z.string().trim().max(500).optional(),
}).strict();
export const newStudent = fields.extend({ studentId });
export const updateStudent = fields.partial().refine(
  value => Object.keys(value).length > 0, "Provide at least one field");
