import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import { studentTypeDefs } from "../modules/students/student.typeDefs.js";
import { studentResolvers } from "../modules/students/student.resolvers.js";
import { markRecordTypeDefs } from
  "../modules/mark-records/mark-record.typeDefs.js";
import { markRecordResolvers } from
  "../modules/mark-records/mark-record.resolvers.js";

export const typeDefs = mergeTypeDefs([studentTypeDefs, markRecordTypeDefs]);
export const resolvers = mergeResolvers([studentResolvers, markRecordResolvers]);
