# Class Workspace — Students GraphQL API

Layout A: **Node.js 24 + TypeScript + Express 5 + Apollo Server 5 + Mongoose 9 + Google OIDC**.
Student and mark-record data operations use GraphQL only. There is no REST CRUD API,
React application, EJS view engine, or separate session database in this project.

## Current classroom version

**OAuth is disabled, not deleted.** The local `.env` and Render Blueprint explicitly
set `AUTH_ENABLED=false`. Queries and mutations use the existing `Students-Data`
database without a login cookie. Validation, error handling, unique indexes and
student/mark relationship rules remain active. Anyone able to reach the deployed
endpoint can change the database while this setting is false.

Google login, callback, logout and encrypted-session code remain in `auth/` for
later use. If `AUTH_ENABLED` is omitted, it defaults to **true** and requires Google
credentials and a session secret. There is no fake signed-in user in demo mode.

## Start here

1. Use Node **24.x**; `.node-version` and `package.json` specify the version.
2. Run `npm ci` from this directory.
3. Keep your existing private `.env`, MongoDB URI and other credentials. Set
   `AUTH_ENABLED=false` and `BASE_URL=http://localhost:3000`. For a fresh checkout,
   copy `.env.example` to `.env` and fill the credentialed `MONGODB_URI` selecting
   `/Students-Data`. Google credentials are not required while authentication is disabled.
4. Confirm Atlas network access permits this computer and the MongoDB user can
   read/write `Students-Data` and create its indexes.
5. Review imported data as described below. If indexes have not already been
   prepared, run `npm run indexes` once. This command changes database indexes;
   ordinary startup does not create indexes or seed records.
6. Run `npm run dev` and open <http://localhost:3000/api-docs> for interactive
   GraphQL operations. `/docs` contains the written reference.
7. Open `requests.rest` with the VS Code REST Client extension, or use Postman:
   `POST /graphql`, `Content-Type: application/json`, and an `Origin` header equal
   to `BASE_URL`. No cookie or Authorization header is needed in this version.

Successful GraphQL creates return HTTP **200** and the new `id` when requested.
They do not return REST's 201. Inspect the response's `errors` array as well as
its status. The rubric's literal REST/201 wording remains a grading distinction.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Load local `.env`, run TypeScript through tsx, restart on changes. |
| `npm run typecheck` | Check TypeScript without emitting files. |
| `npm run build` | Compile backend and maintenance scripts into `dist/`. |
| `npm start` | Run `dist/server.js` with environment variables supplied by the host. |
| `npm run indexes` | Explicit local index preparation; loads `.env`. |
| `npm run indexes:production` | Run the compiled index script with host-supplied settings. |

`npm start` does not load a local `.env` file. For a local production-build run, use
`npm run build` followed by `node --env-file=.env dist/server.js`.
Neither normal startup nor installation seeds records or cleans imported data.

## Project layout

```text
server.ts                           Startup, HTTP listener and graceful shutdown
apps/api/src/
  app.ts                            Middleware order and endpoint registration
  config/env.ts                     Validate environment; report names, not secrets
  db/mongoose.ts                    One shared Students-Data connection
  auth/auth.ts                      Google login/callback and application logout
  auth/session.ts                   Encrypted login transaction and app cookies
  auth/current-user.ts              Google identity -> local users; session restore
  middleware/origin.ts              Same-origin browser-write policy
  middleware/errors.ts              Safe HTTP errors
  routes/health.routes.ts           Public database readiness endpoint
  routes/documentation.routes.ts    Public API reference and generated SDL
  graphql/context.ts                Checked currentUser + shared services
  graphql/schema.ts                 Merge feature SDL and resolver maps
  graphql/errors.ts                 Expected errors and final error masking
  validators/student.ts             Student input rules
  validators/mark-record.ts          Score input rules
  modules/users/user.model.ts       Google issuer/subject identity mapping
  modules/students/
    student.model.ts                Explicit students collection and unique index
    student.typeDefs.ts             GraphQL fields/inputs
    student.resolvers.ts            Two queries and three mutations
    student.service.ts              Validation and application rules
    student.repository.ts           Mongoose database operations
  modules/mark-records/
    mark-record.model.ts            Explicit markRecords collection and unique index
    mark-record.typeDefs.ts         GraphQL fields/inputs
    mark-record.resolvers.ts        Two queries and three mutations
    mark-record.service.ts          Student relationship and score-write rules
    mark-record.repository.ts       Mongoose database operations
    mark-record.calculations.ts     Average from the four checked scores
scripts/create-indexes.ts           Explicit index maintenance, not normal startup
requests.rest                       Local and Render GraphQL HTTP requests
docs/                               Google, API, architecture and deployment guides
render.yaml                         Backend-only Render Blueprint
```

All application source is TypeScript. Relative imports end in `.js` so the same
paths work after NodeNext compilation; `env.js` in an import resolves to source
`env.ts` during development and the generated `env.js` in `dist/` at runtime.

## Database selection and existing data

The URI path selects **`Students-Data`**. Models explicitly select **`students`**,
**`markRecords`**, and **`users`**, so Mongoose pluralization cannot choose a
different collection. Other databases in the Atlas cluster are not selected.
The `users` collection contains local identity profiles; application sessions
live in encrypted HttpOnly cookies. Do not create a `sessions` collection.

Keep MongoDB `_id` and school `studentId`. GraphQL `id` is `_id.toString()`;
`studentId` is the immutable identifier used by API lookups and mark relationships.

Before index preparation, review these existing-data issues:

- Remove accidental trailing punctuation from IDs such as `S001,` and reconcile
  related mark records. Valid API IDs match `S` plus exactly three digits.
- Review duplicate IDs, missing required fields, scores outside 1–10, and mark
  records referencing a missing student. Make an intentional data correction;
  the application does not silently rewrite imported records.
- One mark record per student is enforced by a unique index on `studentId`.
- `users` has a unique `(issuer, subject)` index. Do not use email as the identity key.

`autoIndex` and `autoCreate` are disabled in all environments. Run the explicit
index command after the review and before accepting logins or writes. It creates
declared indexes and can fail on existing duplicate data. It does not remove other
indexes with `syncIndexes()`.

Student deletion is blocked while marks exist. Creating/updating marks and deleting
students use transactions that write the same parent student's `relationVersion`
counter to handle competing operations. Atlas supplies transaction support;
a standalone local MongoDB process does not. All application writers must follow
this protocol; editing collections directly bypasses these rules.

## Authentication and access policy

| Setting | Behavior |
|---|---|
| `AUTH_ENABLED=false` | Classroom demo: all GraphQL data operations are public; Google routes and session middleware are not mounted. Sandbox and introspection are available even on Render. |
| `AUTH_ENABLED=true` (default if omitted) | Google sign-in required for every data operation. Google routes and encrypted sessions are active. Production introspection and Sandbox are disabled. |

The switch is validated from the exact strings `true` and `false`. Changing it
requires an application restart/redeploy. It changes access policy, not GraphQL
fields, feature services, repositories, collections or validation rules.

### Restore Google login later

1. Follow [Google setup](docs/google-setup.md).
2. Set `AUTH_ENABLED=true` and fill `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   and a random `SESSION_SECRET` of at least 32 characters.
3. Register `BASE_URL` plus `/auth/callback` in the Google OAuth client.
4. Restart locally, or save all four settings in Render and redeploy.

Google OIDC uses authorization code flow, PKCE/state/nonce and ID-token signature
validation through `openid-client`. `iron-session` keeps a 10-minute login
transaction and an 8-hour application session in encrypted HttpOnly, SameSite Lax
cookies. Production cookies are Secure and use the `__Host-` prefix. Google tokens
are not stored. Logout clears the app cookies and leaves Google signed in.
The local user is checked before reaching GraphQL context. Existing identities
are not merged by email. See the Google guide for expiry and session limitations.

When authentication is enabled, all signed-in users may manage the sample records;
there are no staff roles, ownership restrictions or users administration CRUD.

In both modes, writes require an `Origin` equal to `BASE_URL`'s origin. Same-origin
browser calls supply it automatically. Postman and REST Client must supply that
header explicitly. This is an origin policy, not user authentication. Cross-origin
CORS access is not enabled. With authentication enabled, external tools also need
the application session cookie; a Google ID token is not a bearer credential here.

## Documentation and deployment

- [Google setup](docs/google-setup.md): retained login implementation; enable it later.
- [API reference](docs/api.md): all ten fields, variables, data and error responses.
- [Architecture](docs/architecture.md): startup, request flow and file responsibilities.
- [Render deployment](docs/deployment.md): build/start, settings, Atlas and Google callback URLs.

Public infrastructure endpoints include `GET /health`, `GET /docs`,
`GET /docs/schema.graphql` and `GET /api-docs` (redirect to `/graphql`).
With `AUTH_ENABLED=false`, the embedded Apollo Sandbox and introspection are enabled
on Render for the classroom demonstration. With authentication enabled, these
are available in development; production keeps the written reference and SDL only.

## Official references

- [Apollo Express 5 integration](https://www.apollographql.com/docs/apollo-server/api/express-middleware)
- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
- [openid-client](https://github.com/panva/openid-client)
- [iron-session](https://github.com/vvo/iron-session)
- [Mongoose 9 migration](https://mongoosejs.com/docs/migrating_to_9.html)
- [Mongoose transactions](https://mongoosejs.com/docs/transactions.html)
- [Node 24 environment files](https://nodejs.org/download/release/latest-v24.x/docs/api/cli.html#--env-filefile)
