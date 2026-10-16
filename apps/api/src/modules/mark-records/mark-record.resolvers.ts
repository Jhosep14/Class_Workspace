import type { Types } from "mongoose";
import type { GraphQLContext } from "../../graphql/context.js";
import { authorized } from "../../graphql/errors.js";

type IdArgs = { studentId: string };
type InputArgs = { input: unknown };
export const markRecordResolvers = {
  Query: {
    markRecords: (_parent: unknown, _args: unknown, context: GraphQLContext) =>
      authorized(context, () => context.services.markRecords.findAll()),
    markRecord: (_parent: unknown, { studentId }: IdArgs,
      context: GraphQLContext) => authorized(context, () =>
        context.services.markRecords.findByStudentId(studentId)),
  },
  Mutation: {
    createMarkRecord: (_parent: unknown, { input }: InputArgs,
      context: GraphQLContext) => authorized(context, () =>
        context.services.markRecords.create(input)),
    updateMarkRecord: (_parent: unknown, { studentId, input }: IdArgs & InputArgs,
      context: GraphQLContext) => authorized(context, () =>
        context.services.markRecords.update(studentId, input)),
    deleteMarkRecord: (_parent: unknown, { studentId }: IdArgs,
      context: GraphQLContext) => authorized(context, () =>
        context.services.markRecords.delete(studentId)),
  },
  MarkRecord: { id: (student: { _id: Types.ObjectId }) => student._id.toString() },
};
