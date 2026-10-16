import type { Types } from "mongoose";
import type { GraphQLContext } from "../../graphql/context.js";
import { authorized } from "../../graphql/errors.js";

type IdArgs = { studentId: string };
type InputArgs = { input: unknown };
export const studentResolvers = {
  Query: {
    students: (_parent: unknown, _args: unknown, context: GraphQLContext) =>
      authorized(context, () => context.services.students.findAll()),
    student: (_parent: unknown, { studentId }: IdArgs,
      context: GraphQLContext) => authorized(context, () =>
        context.services.students.findByStudentId(studentId)),
  },
  Mutation: {
    createStudent: (_parent: unknown, { input }: InputArgs,
      context: GraphQLContext) => authorized(context, () =>
        context.services.students.create(input)),
    updateStudent: (_parent: unknown, { studentId, input }: IdArgs & InputArgs,
      context: GraphQLContext) => authorized(context, () =>
        context.services.students.update(studentId, input)),
    deleteStudent: (_parent: unknown, { studentId }: IdArgs,
      context: GraphQLContext) => authorized(context, () =>
        context.services.students.delete(studentId)),
  },
  Student: { id: (student: { _id: Types.ObjectId }) => student._id.toString() },
};
