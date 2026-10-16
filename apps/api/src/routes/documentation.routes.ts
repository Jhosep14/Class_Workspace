import { Router } from "express";
import { print } from "graphql";
import { typeDefs } from "../graphql/schema.js";
import { env } from "../config/env.js";

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

const operations = [
  ["Query", "students", "List students."],
  ["Query", "student(studentId)", "Find one student; null when missing."],
  ["Query", "markRecords", "List mark records."],
  ["Query", "markRecord(studentId)", "Find one mark record; null when missing."],
  ["Mutation", "createStudent(input)", "Create a student with a unique school ID."],
  ["Mutation", "updateStudent(studentId, input)", "Update permitted student fields."],
  ["Mutation", "deleteStudent(studentId)", "Delete only after removing the student's marks."],
  ["Mutation", "createMarkRecord(input)", "Save scores for an existing student."],
  ["Mutation", "updateMarkRecord(studentId, input)", "Change scores and recalculate the average."],
  ["Mutation", "deleteMarkRecord(studentId)", "Remove the mark record; keep the student."],
] as const;

const requestExample = `const response = await fetch("/graphql", {
  method: "POST",
  credentials: "same-origin",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "query ($id: String!) { student(studentId: $id) { studentId name lastName grade } }",
    variables: { id: "S002" }
  })
});
const result = await response.json();
console.log(result); // Inspect both data and errors.`;

export const documentationRouter = Router();
documentationRouter.get("/schema.graphql", (_req, res) => {
  res.type("text/plain").send(print(typeDefs));
});
documentationRouter.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Students API reference</title>
<style>
body{font:16px/1.6 system-ui,sans-serif;color:#172433;background:#f3f6f8;margin:0}
main{max-width:960px;margin:40px auto;padding:28px;background:white}
a{color:#087e78}h1,h2{line-height:1.2}h2{margin-top:40px}
pre{overflow:auto;padding:20px;border-radius:8px;background:#101c2a;color:#e1ebf1}
code{font-family:ui-monospace,monospace}table{border-collapse:collapse;width:100%}
td,th{border:1px solid #d9e1e8;text-align:left;padding:10px}th{background:#eaf1f5}
nav a{margin-right:16px}
</style></head><body><main>
<nav><a href="/">API home / sign in</a><a href="/graphql">GraphQL</a>
<a href="/docs/schema.graphql">Download SDL</a></nav>
<h1>Students API reference</h1>
<p>One data endpoint: <code>POST /graphql</code>. Every student and mark-record
operation follows the current access mode:
${env.AUTH_ENABLED ? "Google login is required. All signed-in users may manage the sample records."
    : "Classroom demo: OAuth is disabled; queries and mutations are public."}</p>
<h2>Authentication</h2>
${env.AUTH_ENABLED ? `<p>Navigate to <a href="/auth/login">/auth/login</a>, complete Google sign-in,
then return here. The browser sends the encrypted HttpOnly session cookie automatically.
Sign out using the form on <a href="/">the API home page</a>.</p>
<p>The application session expires after 8 hours. Signing out clears this app's
cookies and leaves your Google account signed in.</p>`
    : `<p>No login cookie or Authorization header is needed. Google login code is
retained but inactive while AUTH_ENABLED=false. Open
<a href="/api-docs">interactive GraphQL documentation</a> to run operations.</p>`}
<h2>Operations</h2><table><thead><tr><th>Type</th><th>Field</th><th>Behavior</th></tr></thead>
<tbody>${operations.map(([type, name, meaning]) =>
    `<tr><td>${type}</td><td><code>${name}</code></td><td>${meaning}</td></tr>`).join("")}</tbody></table>
<h2>Call the API from this origin</h2>
<p>${env.AUTH_ENABLED ? "After signing in, paste" : "Paste"} this example into this page's browser console.
GraphQL may return HTTP 200 with an <code>errors</code> array.</p>
<pre><code>${escapeHtml(requestExample)}</code></pre>
<h2>Rules</h2><ul>
<li>School IDs use S followed by three digits; keep MongoDB's separate _id.</li>
<li>Grades are integers from 1 to 12; ages are integers from 0 to 120.</li>
<li>DOB uses MM-DD-YY: 00–29 means 2000–2029, 30–99 means 1930–1999.
Dates must be real and not in the future. Stored age is a snapshot.</li>
<li>One mark record per student; each of four scores is from 1 to 10.
The server calculates averageScore to two decimal places.</li>
<li>Updates must include a permitted field. Identifiers and calculated averages cannot be changed by input.</li>
<li>Remove a student's mark record before deleting the student.</li></ul>
<h2>Errors</h2>
<p>GraphQL codes include UNAUTHENTICATED, BAD_USER_INPUT, NOT_FOUND,
CONFLICT and INTERNAL_SERVER_ERROR. A missing single-record query returns null.
Missing update/delete targets produce NOT_FOUND. Unexpected errors are logged on
the server and masked in responses. HTTP failures include 400, 403, 404 and 413.</p>
<p>The API accepts same-origin browser writes. External tools need an Origin matching BASE_URL.
${env.AUTH_ENABLED ? "They also need the application session cookie; a Google ID token is not a bearer credential for this API."
    : "No cookie is required in classroom mode. All validation and database rules remain active."}
See docs/api.md for all query/mutation examples and request details.</p>
<h2>Schema</h2><pre><code>${escapeHtml(print(typeDefs))}</code></pre>
<p>The schema below is generated from the application's feature definitions.
${!env.AUTH_ENABLED ? "Classroom mode enables Apollo Sandbox and introspection at /graphql, including on Render."
    : "Apollo Sandbox is available in development; authenticated production disables Sandbox and introspection."}</p>
</main></body></html>`);
});
