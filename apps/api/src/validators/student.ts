import { z } from "zod";

// Student IDs use the format S followed by exactly three digits.
export const studentId = z.string().regex(/^S\d{3}$/);

// Accept numeric strings from clients, then require an integer value.
const integerInput = z.preprocess(
  value => typeof value === "string" && value.trim() !== ""
    ? Number(value)
    : value,
  z.number().int(),
);

// Require a real, non-future date in MM-DD-YY format.
const dateOfBirth = z.string()
  .regex(/^\d{2}-\d{2}-\d{2}$/)
  .refine(value => {
    const [month, day, shortYear] = value.split("-").map(Number);
    const year = shortYear <= 29 ? 2000 + shortYear : 1900 + shortYear;
    const date = new Date(Date.UTC(year, month - 1, day));

    return date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day &&
      date.getTime() <= Date.now();
  }, "Use a real, non-future date in MM-DD-YY format");

// Shared editable student fields. Strict mode rejects unknown properties.
const studentFields = z.object({
  name: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  sex: z.string().trim().min(1).max(40),
  age: integerInput.pipe(z.number().min(0).max(120)),
  class: z.string().trim().min(1).max(20),
  grade: integerInput.pipe(z.number().min(1).max(12)),
  dob: dateOfBirth,
  profileImageKey: z.string().trim().max(500).optional(),
}).strict();

// Creation requires all student fields plus the student's ID.
export const newStudent = studentFields.extend({ studentId });

// Updates allow any subset of editable fields, but reject an empty patch.
export const updateStudent = studentFields.partial().refine(
  value => Object.keys(value).length > 0,
  "Provide at least one field",
);
