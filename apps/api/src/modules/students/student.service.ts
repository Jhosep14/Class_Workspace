import mongoose from "mongoose";
import { studentRepository } from "./student.repository.js";
import { markRecordRepository } from
  "../mark-records/mark-record.repository.js";
import { studentId, newStudent, updateStudent } from
  "../../validators/student.js";
import { AppError } from "../../middleware/errors.js";

export const studentService = {
  findAll: () => studentRepository.findAll(),
  findByStudentId: (id: string) =>
    studentRepository.findByStudentId(studentId.parse(id)),
  create: (input: unknown) => studentRepository.create(newStudent.parse(input)),
  update: async (id: string, input: unknown) => {
    const student = await studentRepository.update(
      studentId.parse(id), updateStudent.parse(input));
    if (!student) throw new AppError(404, "Student not found");
    return student;
  },
  delete: async (id: string) => {
    const key = studentId.parse(id);
    await mongoose.connection.transaction(async session => {
      if (!await studentRepository.lock(key, session))
        throw new AppError(404, "Student not found");
      if (await markRecordRepository.findByStudentId(key, session))
        throw new AppError(409, "Remove the mark record before deleting this student");
      await studentRepository.delete(key, session);
    });
    return true;
  },
};
