import { studentService } from "../modules/students/student.service.js";
import { markRecordService } from
  "../modules/mark-records/mark-record.service.js";
import { GraphQLError } from "graphql";
import type { Request } from "express";
import "express-session";


//----------Auth Context ---------
export type AuthUser = {
  githubId: number;
  login: string;
};

declare module "express-session" {
  interface SessionData {
    oauthState?: string;
    pkceVerifier?: string;
    user?: AuthUser;
  }
}

export type GraphQLContext = {
  user: AuthUser | null;
  services: {
    students: typeof studentService;
    markRecords: typeof markRecordService;
  };
};

// One context per request shares the logged-in identity and the existing feature services.
export async function createContext(
  { req }: { req: Request },
): Promise<GraphQLContext> {
  return {
    user: req.session.user ?? null,
    services: {
      students: studentService,
      markRecords: markRecordService,
    },
  };
}

// Root resolvers call this before service work so unauthenticated GraphQL calls are rejected.
export function requireAuthenticatedUser(context: GraphQLContext): AuthUser {
  if (!context.user) {
    throw new GraphQLError("Sign in is required.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }

  return context.user;
}
