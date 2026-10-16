import type { z } from "zod";
import type { scores } from "../../validators/mark-record.js";

export function average(value: z.output<typeof scores>): number {
  return Math.round((value.mathScore + value.scienceScore +
    value.englishScore + value.spanishScore) / 4 * 100) / 100;
}
