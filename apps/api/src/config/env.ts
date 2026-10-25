import { z } from "zod";

const settings = z.object({
  NODE_ENV: z.enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//).refine(value => {
    const address = value.split("://")[1]?.split("?")[0] ?? "";
    const slash = address.indexOf("/");
    return slash > 0 && address.slice(slash + 1) === "Students-Data";
  }, "The URI must select /Students-Data"),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
});

const parsed = settings.safeParse(process.env);
if (!parsed.success) {
  // Report setting names, never their credential values.
  const names = [...new Set(parsed.error.issues.map(issue =>
    issue.path.join(".") || "environment"))];
  throw new Error(`Configure ${names.join(", ")} in .env. ` +
    "See README.md. No credentials are logged.");
}
export const env = parsed.data;
