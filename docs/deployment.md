# Deploy the backend to Render

## Prerequisites

- Put this project in a GitHub repository, with `.env` ignored and the lockfile committed.
- The current classroom version uses `AUTH_ENABLED=false`. Google login code is
  retained, but Google credentials and cookies are not required for this version.
- Review existing Atlas data and run `npm run indexes` locally against the target
  database before accepting production traffic. The declared indexes persist in Atlas.
- Permit your Render service's outbound addresses in Atlas Network Access and use
  a database user with the required `Students-Data` permissions.

## Create the service

Use the root `render.yaml` as a Blueprint, or create a Node web service with:

| Setting | Value |
|---|---|
| Root directory | Repository root |
| Runtime | Node 24, from `.node-version` |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `npm start` |
| Health check | `/health` |

Render supplies `PORT`; the server binds `0.0.0.0`. There is no static frontend
service and no EJS/view-copy build step.

## Environment variables

| Name | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `TRUST_PROXY_HOPS` | `1` for Render's proxy arrangement |
| `BASE_URL` | Actual public HTTPS service origin, no subpath |
| `MONGODB_URI` | Existing credentialed Atlas URI, with `/Students-Data` database path |
| `AUTH_ENABLED` | `false` for the current classroom demonstration |

Set secrets through Render's environment settings. Do not upload `.env` or put
credentials into `render.yaml`. The Blueprint explicitly sets `AUTH_ENABLED=false`.
The only secret needed for this mode is the MongoDB URI. Keep the existing
`Students-Data` database. Anyone with the API URL can perform CRUD while login is
disabled; origin checking does not authenticate callers.

After creating the web service, copy its actual assigned HTTPS origin into
`BASE_URL`. If an initial deployment ran before the environment or Atlas network
access was complete, finish those settings and redeploy. Permit the service's
outbound IP ranges (Render -> Connect -> Outbound) in Atlas Network Access.

## Restore OAuth in a later version

The Google files and dependencies are preserved. To restore login, set
`AUTH_ENABLED=true` and add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and a stable
random `SESSION_SECRET` of at least 32 characters. Register `BASE_URL` plus
`/auth/callback` in Google and redeploy. See [Google setup](google-setup.md).
If `AUTH_ENABLED` is omitted, it defaults to true and missing Google settings
prevent startup. Do not rely on an absent flag to disable authentication.

If index maintenance is needed later from a deployment environment, first review
the data and run `npm run indexes:production` through an authorized maintenance
execution mechanism. It needs the built scripts and the same environment values;
it is not a pre-start command that runs on every deploy.

The public `/health` returns 200 only while Mongoose is connected, otherwise 503.
`/docs` and `/docs/schema.graphql` are public references. In classroom mode,
`/graphql` serves embedded Sandbox, `/api-docs` redirects there, introspection is
enabled, and GraphQL operations need no cookie. After restoring authentication,
production disables Sandbox/introspection and requires login for data operations.

## Demonstrate CRUD

Open `/api-docs` in your browser, or follow [API examples](api.md) in Postman.
Use the same Origin as BASE_URL for POST requests. Create a student with an unused
ID, query it, update it, query again, delete it (after any marks), and confirm its
query returns null. Refresh Atlas to show the persisted changes. No scripts in
this repository automatically create or delete demonstration records.

References: [Render web services](https://render.com/docs/web-services),
[Node versions](https://render.com/docs/node-version),
[Blueprint schema](https://render.com/docs/blueprint-spec),
[Atlas connectivity](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/).
