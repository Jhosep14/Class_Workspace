import type { ClientSession } from "mongoose";
import type { z } from "zod";
import type { newStudent, updateStudent } from "../../validators/student.js";
import { StudentModel } from "./student.model.js";

type NewStudent = z.output<typeof newStudent>;
type UpdateStudent = z.output<typeof updateStudent>;
export const studentRepository = {
  findAll: () => StudentModel.find().sort({ studentId: 1 }).lean(),
  findByStudentId: (studentId: string) =>
    StudentModel.findOne({ studentId }).lean(),
  create: async (input: NewStudent) => (await StudentModel.create(input)).toObject(),
  update: (studentId: string, input: UpdateStudent) =>
    StudentModel.findOneAndUpdate({ studentId }, { $set: input }, {
      returnDocument: "after", runValidators: true,
    }).lean(),
  lock: (studentId: string, session: ClientSession) =>
    StudentModel.findOneAndUpdate({ studentId }, {
      $inc: { relationVersion: 1 },
    }, { returnDocument: "after", session }).lean(),
  delete: (studentId: string, session: ClientSession) =>
    StudentModel.findOneAndDelete({ studentId }, { session }).lean(),
};
