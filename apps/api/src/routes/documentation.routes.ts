import { Router } from "express";
import { print } from "graphql";
import { typeDefs } from "../graphql/schema.js";

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

const httpRoutes = [
  ["GET", "/", "API landing page with links to the documentation and GraphQL Explorer."],
  ["GET", "/health", "Database readiness; returns 200 when connected or 503 when unavailable."],
  ["GET", "/docs", "This API reference."],
  ["GET", "/docs/schema.graphql", "The GraphQL schema as plain text."],
  ["GET", "/api-docs", "Redirects to /graphql."],
  ["GET / POST", "/graphql", "GraphQL Explorer and query/mutation endpoint."],
] as const;

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

export const documentationRouter = Router();
documentationRouter.get("/schema.graphql", (_req, res) => {
  res.type("text/plain").send(print(typeDefs));
});
documentationRouter.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Operations and Schema</title>
<style>
body{font:16px/1.6 system-ui,sans-serif;color:#172433;background:#f3f6f8;margin:0}
main{max-width:960px;margin:40px auto;padding:28px;background:white}
h1,h2{line-height:1.2}h2{margin-top:40px}
pre{overflow:auto;padding:20px;border-radius:8px;background:#101c2a;color:#e1ebf1}
code{font-family:ui-monospace,monospace}table{border-collapse:collapse;width:100%}
td,th{border:1px solid #d9e1e8;text-align:left;padding:10px}th{background:#eaf1f5}
</style></head><body><main>
<h1>API routes</h1>
<table><thead><tr><th>Method</th><th>Path</th><th>Behavior</th></tr></thead>
<tbody>${httpRoutes.map(([method, path, meaning]) =>
    `<tr><td>${escapeHtml(method)}</td><td><code>${escapeHtml(path)}</code></td><td>${escapeHtml(meaning)}</td></tr>`).join("")}</tbody></table>
<h2>GraphQL operations</h2>
<table><thead><tr><th>Type</th><th>Field</th><th>Behavior</th></tr></thead>
<tbody>${operations.map(([type, name, meaning]) =>
    `<tr><td>${escapeHtml(type)}</td><td><code>${escapeHtml(name)}</code></td><td>${escapeHtml(meaning)}</td></tr>`).join("")}</tbody></table>
<h2>Input validation</h2>
<ul>
<li>Student IDs use the format S followed by exactly three digits.</li>
<li>Student names, class, age, grade, and date of birth are checked; date of birth must be a real, non-future date in MM-DD-YY format.</li>
<li>Scores must be between 1 and 10. A new mark record requires all four subject scores.</li>
<li>Update inputs must include at least one field. Unknown input fields are rejected.</li>
</ul>
<h2>Error responses</h2>
<p>Unknown HTTP paths return 404. The health route returns 503 when the database is unavailable. GraphQL input errors use <code>BAD_USER_INPUT</code>; missing records use <code>NOT_FOUND</code>; conflicts use <code>CONFLICT</code>. Unexpected server errors are logged and returned without internal details.</p>
<h2>GraphQL schema</h2>
<pre><code>${escapeHtml(print(typeDefs))}</code></pre>
</main></body></html>`);
});
