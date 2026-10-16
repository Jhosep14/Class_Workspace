import type { ClientSession } from "mongoose";
import type { z } from "zod";
import type { scores } from "../../validators/mark-record.js";
import { MarkRecordModel } from "./mark-record.model.js";

type Scores = z.output<typeof scores> & { averageScore: number };
export const markRecordRepository = {
  findAll: () => MarkRecordModel.find().sort({ studentId: 1 }).lean(),
  findByStudentId: (studentId: string, session?: ClientSession) =>
    MarkRecordModel.findOne({ studentId }, null, { session }).lean(),
  create: async (input: Scores & { studentId: string }, session: ClientSession) =>
    (await MarkRecordModel.create([input], { session }))[0].toObject(),
  update: (studentId: string, input: Scores, session: ClientSession) =>
    MarkRecordModel.findOneAndUpdate({ studentId }, { $set: input }, {
      returnDocument: "after", runValidators: true, session,
    }).lean(),
  delete: (studentId: string) =>
    MarkRecordModel.findOneAndDelete({ studentId }).lean(),
};
