# GraphQL API reference

## Endpoints and authentication

| Endpoint | Purpose |
|---|---|
| `POST /graphql` | All student and mark-record queries/mutations. |
| `GET /graphql` | Interactive Sandbox in classroom mode/development; GraphQL queries need Apollo headers. |
| `GET /api-docs` | Redirect to `/graphql` for interactive documentation. |
| `GET /auth/login` | Google sign-in, only when `AUTH_ENABLED=true`. |
| `GET /auth/callback` | Google callback, only when `AUTH_ENABLED=true`. |
| `POST /auth/logout` | Clear app/login cookies, only when `AUTH_ENABLED=true`; keep Google signed in. |
| `GET /health` | Public database readiness, HTTP 200 or 503. |
| `GET /docs` | Public HTML API reference. |
| `GET /docs/schema.graphql` | Public SDL generated from the actual feature definitions. |

**Current classroom mode: `AUTH_ENABLED=false`.** All queries and mutations
work without a Google login, application cookie or Authorization header. The
existing MongoDB database is used, with input validation and relationship rules.
Google code is retained; it is not mounted while the switch is false.

When `AUTH_ENABLED=true` (also the default when omitted), every data operation
requires a signed-in application session. See [Google setup](google-setup.md).
Google client settings and `SESSION_SECRET` are required only in that mode.

Send JSON with `Content-Type: application/json`. Use the browser-facing BASE_URL
as the request origin. The examples assume `http://localhost:3000`; use the Render
HTTPS origin in production. The body limit is 32 KB. A GraphQL query or mutation
is the operation inside the HTTP request, not a separate URL or an HTTP PUT/DELETE.

## First request

1. Open `/api-docs` to run queries directly, or use the fetch example below from
   `/docs` on the same origin. No login is needed in the current classroom mode.
2. Only if `AUTH_ENABLED=true`, sign in through `/auth/login` first.
3. From a page on the same API origin, run this in the browser console:

```js
const response = await fetch("/graphql", {
  method: "POST",
  credentials: "same-origin",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "query Student($studentId: String!) { student(studentId: $studentId) { id studentId name lastName grade } }",
    variables: { studentId: "S002" }
  })
});
const result = await response.json();
console.log(response.status, result);
```

Expected shape, if S002 exists and its stored fields are valid:

```json
{
  "data": {
    "student": {
      "id": "<MongoDB ObjectId as a string>",
      "studentId": "S002",
      "name": "Noah",
      "lastName": "Reyes",
      "grade": 9
    }
  }
}
```

For Postman or a command-line client in the current classroom mode:

```bash
curl http://localhost:3000/graphql \
  -H 'Origin: http://localhost:3000' \
  -H 'Content-Type: application/json' \
  --data '{"query":"{ students { id studentId name lastName grade } }"}'
```

On Render, replace **both** localhost origins with your actual HTTPS service
origin. In Postman, use an HTTP request with method POST, Body -> GraphQL and
No Auth. Send `Content-Type: application/json` and `Origin: <your BASE_URL>`.
Use `requests.rest` for saved local/Render requests. The cookie is unnecessary
while `AUTH_ENABLED=false`; if login is restored later, send the app session
cookie as well. Keep cookie values private. Cross-origin browser clients are
not enabled.

An HTTP 403 typically means Origin does not match BASE_URL. Successful GraphQL
creates return HTTP 200, not 201; request `id` in the mutation to see MongoDB's
new identifier. An `errors` array can accompany HTTP 200, so inspect the body.

## Operation examples

Submit each operation separately. If submitting a document containing multiple
operations, set `operationName` in the HTTP JSON body. Variables belong beside
`query`, not inside the GraphQL string. Replace S011 with an unused valid ID for
create examples; these examples are not automatically executed.

### 1. List students

```graphql
query Students {
  students { id studentId name lastName sex age class grade dob profileImageKey }
}
```

### 2. Find a student

```graphql
query Student($studentId: String!) {
  student(studentId: $studentId) {
    id studentId name lastName sex age class grade dob profileImageKey
  }
}
```

Variables: `{"studentId":"S002"}`. A valid but missing ID returns
`{"data":{"student":null}}`.

### 3. Create a student

```graphql
mutation CreateStudent($input: NewStudentInput!) {
  createStudent(input: $input) { id studentId name lastName grade }
}
```

```json
{
  "input": {
    "studentId": "S011", "name": "Alex", "lastName": "Rivera",
    "sex": "Female", "age": 16, "class": "A", "grade": 10,
    "dob": "04-12-10", "profileImageKey": "students/S011/profile.jpg"
  }
}
```

### 4. Update a student

```graphql
mutation UpdateStudent($studentId: String!, $input: UpdateStudentInput!) {
  updateStudent(studentId: $studentId, input: $input) {
    studentId name lastName grade
  }
}
```

Variables: `{"studentId":"S011","input":{"grade":11}}`.
Other fields are preserved. Missing target: NOT_FOUND.

### 5. Delete a student

```graphql
mutation DeleteStudent($studentId: String!) {
  deleteStudent(studentId: $studentId)
}
```

Variables: `{"studentId":"S011"}`. Returns true on success. If a mark record
exists, returns CONFLICT and preserves both records. Delete the marks first.

### 6. List mark records

```graphql
query MarkRecords {
  markRecords {
    id studentId mathScore scienceScore englishScore spanishScore averageScore
  }
}
```

### 7. Find a mark record

```graphql
query MarkRecord($studentId: String!) {
  markRecord(studentId: $studentId) {
    id studentId mathScore scienceScore englishScore spanishScore averageScore
  }
}
```

Variables: `{"studentId":"S002"}`. A valid but missing ID returns null.

### 8. Create a mark record

```graphql
mutation CreateMarkRecord($input: NewMarkRecordInput!) {
  createMarkRecord(input: $input) {
    studentId mathScore scienceScore englishScore spanishScore averageScore
  }
}
```

```json
{
  "input": {
    "studentId": "S011", "mathScore": 8, "scienceScore": 9,
    "englishScore": 7, "spanishScore": 10
  }
}
```

The student must already exist. The server returns averageScore 8.5 for these
scores. A second mark record for the same student returns CONFLICT.

### 9. Update scores

```graphql
mutation UpdateMarkRecord($studentId: String!, $input: UpdateMarkRecordInput!) {
  updateMarkRecord(studentId: $studentId, input: $input) {
    studentId mathScore scienceScore englishScore spanishScore averageScore
  }
}
```

Variables: `{"studentId":"S011","input":{"mathScore":10}}`.
Using the previous scores, the new average is 9. The server combines the patch
with stored scores and recalculates the average in a transaction.

### 10. Delete a mark record

```graphql
mutation DeleteMarkRecord($studentId: String!) {
  deleteMarkRecord(studentId: $studentId)
}
```

Variables: `{"studentId":"S011"}`. Returns true; the student is not deleted.
Missing target: NOT_FOUND.

## Input rules

| Field | Rule |
|---|---|
| `studentId` | `S` followed by exactly three digits; immutable after creation. |
| `name`, `lastName` | Trimmed, nonblank strings, at most 100 characters. |
| `sex` | Trimmed, nonblank string, at most 40 characters. |
| `age` | Integer 0–120; stored snapshot, not automatically recalculated. |
| `class` | Trimmed, nonblank string, at most 20 characters. |
| `grade` | Integer 1–12. |
| `dob` | Real, non-future MM-DD-YY date; 00–29 maps to 2000–2029, 30–99 to 1930–1999. |
| `profileImageKey` | Optional string, at most 500 characters; no upload endpoint. |
| Four score fields | Finite numbers 1–10; decimals allowed. |
| `averageScore` | Calculated from all four scores, rounded to two decimals; never accepted as input. |
| Partial updates | At least one permitted field; explicit null values are rejected. |

MongoDB `_id` is not an input parameter. GraphQL `id` is its string representation.
The internal relationVersion counter is neither an input nor an exposed field.

## Errors and HTTP responses

| Condition | GraphQL code or HTTP status |
|---|---|
| No signed-in local user | UNAUTHENTICATED |
| Bad field values or an empty update | BAD_USER_INPUT |
| Missing update/delete target or required parent student | NOT_FOUND |
| Duplicate ID or a student still has marks | CONFLICT |
| Invalid operation structure | GRAPHQL_VALIDATION_FAILED or GRAPHQL_PARSE_FAILED |
| Unexpected storage/completion failure | INTERNAL_SERVER_ERROR, details masked |
| Malformed HTTP JSON | HTTP 400 |
| Wrong/missing write Origin | HTTP 403 before GraphQL |
| Unknown HTTP URL | HTTP 404 |
| JSON body over 32 KB | HTTP 413 |

```json
{
  "errors": [{
    "message": "Remove the mark record before deleting this student",
    "extensions": { "code": "CONFLICT" }
  }],
  "data": null
}
```

Errors may include field `path` and `locations`. HTTP 200 can contain GraphQL
errors or partial data; clients must inspect both. HTTP parser failures use
`{"error":"..."}` instead of the GraphQL response envelope. Error middleware
does not expose raw database errors or stack traces to clients.

## Limits and scope

Lists currently return all matching records in studentId order. Pagination,
school-specific roles, audit logs, file uploads and machine-to-machine bearer
authentication are future features, not implied by these operations.
