import type { Request, Response } from "express";
import { z } from "zod";
import { studentService } from "../modules/students/student.service.js";
import { markRecordService } from
  "../modules/mark-records/mark-record.service.js";

const services = { students: studentService, markRecords: markRecordService };
const currentUserSchema = z.object({ id: z.string().min(1) }).strict();
export type CurrentUser = z.output<typeof currentUserSchema>;
export type GraphQLContext = {
  currentUser: CurrentUser | null;
  services: typeof services;
};
export async function createContext({ res }: {
  req: Request; res: Response;
}): Promise<GraphQLContext> {
  return {
    currentUser: res.locals.currentUser == null
      ? null : currentUserSchema.parse(res.locals.currentUser),
    services,
  };
}
