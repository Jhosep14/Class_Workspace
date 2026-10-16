import mongoose from "mongoose";
import { markRecordRepository as repo } from "./mark-record.repository.js";
import { studentRepository } from "../students/student.repository.js";
import { studentId } from "../../validators/student.js";
import { scores, newMarkRecord, updateMarkRecord } from
  "../../validators/mark-record.js";
import { average } from "./mark-record.calculations.js";
import { AppError } from "../../middleware/errors.js";

export const markRecordService = {
  findAll: () => repo.findAll(),
  findByStudentId: (id: string) => repo.findByStudentId(studentId.parse(id)),
  create: async (input: unknown) => {
    const value = newMarkRecord.parse(input);
    return mongoose.connection.transaction(async session => {
      if (!await studentRepository.lock(value.studentId, session))
        throw new AppError(404, "Student not found");
      return repo.create({ ...value, averageScore: average(value) }, session);
    });
  },
  update: async (id: string, input: unknown) => {
    const key = studentId.parse(id);
    const patch = updateMarkRecord.parse(input);
    return mongoose.connection.transaction(async session => {
      if (!await studentRepository.lock(key, session))
        throw new AppError(404, "Student not found");
      const current = await repo.findByStudentId(key, session);
      if (!current) throw new AppError(404, "Mark record not found");
      const value = scores.parse({
        mathScore: current.mathScore, scienceScore: current.scienceScore,
        englishScore: current.englishScore, spanishScore: current.spanishScore,
        ...patch,
      });
      const updated = await repo.update(key, {
        ...value, averageScore: average(value),
      }, session);
      if (!updated) throw new AppError(404, "Mark record not found");
      return updated;
    });
  },
  delete: async (id: string) => {
    if (!await repo.delete(studentId.parse(id)))
      throw new AppError(404, "Mark record not found");
    return true;
  },
};
