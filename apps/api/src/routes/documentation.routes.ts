import { Router } from "express";
import { print } from "graphql";
import { typeDefs } from "../graphql/schema.js";

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
<h1>Operations</h1>
<table><thead><tr><th>Type</th><th>Field</th><th>Behavior</th></tr></thead>
<tbody>${operations.map(([type, name, meaning]) =>
    `<tr><td>${type}</td><td><code>${name}</code></td><td>${meaning}</td></tr>`).join("")}</tbody></table>
<h2>Schema</h2>
<pre><code>${escapeHtml(print(typeDefs))}</code></pre>
</main></body></html>`);
});
