import type { Types } from "mongoose";
import type { GraphQLContext } from "../../graphql/context.js";
import { requireAuthenticatedUser } from "../../graphql/context.js";
import { handleGraphQLError } from "../../graphql/errors.js";

type IdArgs = { studentId: string };
type InputArgs = { input: unknown };
export const studentResolvers = {
  // Check the session before returning student data.
  Query: {
    students: (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext) => {
      requireAuthenticatedUser(context);
      return handleGraphQLError(() => context.services.students.findAll());
    },
    student: (
      _parent: unknown,
      { studentId }: IdArgs,
      context: GraphQLContext) => {
      requireAuthenticatedUser(context);
      return handleGraphQLError(() =>
        context.services.students.findByStudentId(studentId));
    },
  },
  // Check the session before allowing a student record to be changed.
  Mutation: {
    createStudent: (
      _parent: unknown,
      { input }: InputArgs,
      context: GraphQLContext) => {
      requireAuthenticatedUser(context);
      return handleGraphQLError(() => context.services.students.create(input));
    },
    updateStudent: (
      _parent: unknown,
      { studentId, input }: IdArgs & InputArgs,
      context: GraphQLContext) => {
      requireAuthenticatedUser(context);
      return handleGraphQLError(() =>
        context.services.students.update(studentId, input));
    },
    deleteStudent: (_parent: unknown, { studentId }: IdArgs,
      context: GraphQLContext) => {
      requireAuthenticatedUser(context);
      return handleGraphQLError(() =>
        context.services.students.delete(studentId));
    },
  },
  Student: { id: (student: { _id: Types.ObjectId }) => student._id.toString() },
};
