import { studentService } from "../modules/students/student.service.js";
import { markRecordService } from
  "../modules/mark-records/mark-record.service.js";

const services = { students: studentService, markRecords: markRecordService };
export type GraphQLContext = {
  services: typeof services;
};
export async function createContext(): Promise<GraphQLContext> {
  return { services };
}
