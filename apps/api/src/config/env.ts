import { z } from "zod";

const browserOrigin = z.url({ protocol: /^https?$/ }).refine(value => {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return url.pathname === "/" && !url.search && !url.hash &&
    !url.username && !url.password;
}, "Use an origin without a path, query or fragment");

const settings = z.object({
  NODE_ENV: z.enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//).refine(value => {
    const address = value.split("://")[1]?.split("?")[0] ?? "";
    const slash = address.indexOf("/");
    return slash > 0 && address.slice(slash + 1) === "Students-Data";
  }, "The URI must select /Students-Data"),
  BASE_URL: browserOrigin,
  AUTH_ENABLED: z.enum(["true", "false"]).default("true")
    .transform(value => value === "true"),
  GOOGLE_CLIENT_ID: z.string().trim().default(""),
  GOOGLE_CLIENT_SECRET: z.string().trim().default(""),
  SESSION_SECRET: z.string().default(""),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
}).superRefine((value, context) => {
  if (value.AUTH_ENABLED) {
    for (const name of ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] as const) {
      if (!value[name]) context.addIssue({ code: "custom", path: [name],
        message: "Required when AUTH_ENABLED=true" });
    }
    if (value.SESSION_SECRET.length < 32) {
      context.addIssue({ code: "custom", path: ["SESSION_SECRET"],
        message: "At least 32 characters required when AUTH_ENABLED=true" });
    }
  }
  if (value.NODE_ENV === "production" && URL.canParse(value.BASE_URL) &&
      new URL(value.BASE_URL).protocol !== "https:") {
    context.addIssue({ code: "custom", path: ["BASE_URL"],
      message: "Production requires an HTTPS browser origin" });
  }
});

const parsed = settings.safeParse(process.env);
if (!parsed.success) {
  // Report setting names, never their credential values.
  const names = [...new Set(parsed.error.issues.map(issue =>
    issue.path.join(".") || "environment"))];
  throw new Error(`Configure ${names.join(", ")} in .env. ` +
    "See README.md and docs/google-setup.md. No credentials are logged.");
}
export const env = parsed.data;
